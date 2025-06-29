"use server";

import webpush from "web-push";
import { sql } from "./db";
import {
  getPendingNotifications,
  markNotificationAsSent,
} from "./notifications";

// VAPID 키 설정
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn("⚠️  VAPID keys not found. Push notifications will not work.");
  console.warn("   Run: node scripts/generate-vapid-keys.js to generate keys");
} else {
  webpush.setVapidDetails(
    "mailto:your-email@example.com", // 연락처 이메일
    vapidPublicKey,
    vapidPrivateKey
  );
}

// NOTE: 단일 푸시 알림 발송
export async function sendPushNotification(
  subscription: Record<string, unknown>,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    notificationId?: number;
    priority?: "low" | "normal" | "high" | "urgent";
  }
) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/badge-72x72.png",
      data: payload.data || {},
      notificationId: payload.notificationId,
      priority: payload.priority || "normal",
      timestamp: Date.now(),
      tag: "lastmove-notification",
    });

    const options = {
      TTL: 60 * 60 * 24, // 24시간
      urgency:
        payload.priority === "urgent"
          ? "high"
          : payload.priority === "high"
          ? "high"
          : payload.priority === "low"
          ? "low"
          : "normal",
    };

    const result = await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      pushPayload,
      options
    );

    console.log("✅ Push notification sent successfully:", result.statusCode);
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    console.error("❌ Failed to send push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// NOTE: 대기 중인 모든 알림 발송
export async function sendPendingNotifications() {
  try {
    console.log("🚀 Checking for pending notifications...");

    const pendingNotifications = await getPendingNotifications();

    if (pendingNotifications.length === 0) {
      console.log("📭 No pending notifications found");
      return { success: true, sent: 0, message: "발송할 알림이 없습니다" };
    }

    console.log(
      `📬 Found ${pendingNotifications.length} pending notifications`
    );

    // 사용자별 구독 정보 가져오기
    const subscriptions = await sql`
      SELECT user_id, push_subscription 
      FROM user_notification_settings 
      WHERE push_subscription IS NOT NULL
        AND push_subscription != ''
    `;

    if (subscriptions.rows.length === 0) {
      console.log("📭 No active push subscriptions found");
      return { success: true, sent: 0, message: "활성 구독이 없습니다" };
    }

    let sentCount = 0;
    let errorCount = 0;

    // 각 알림에 대해 발송 시도
    for (const notification of pendingNotifications) {
      try {
        // 해당 사용자의 구독 정보 찾기
        const userSubscription = subscriptions.rows.find(
          (sub) => sub.user_id === notification.user_id
        );

        if (!userSubscription?.push_subscription) {
          console.log(
            `⚠️  No subscription found for user: ${notification.user_id}`
          );
          continue;
        }

        const subscription = JSON.parse(userSubscription.push_subscription);

        const result = await sendPushNotification(subscription, {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          data: notification.data,
          notificationId: notification.id,
          priority: notification.priority,
        });

        if (result.success) {
          await markNotificationAsSent(notification.id, true);
          sentCount++;
          console.log(
            `✅ Sent notification ${notification.id}: ${notification.title}`
          );
        } else {
          await markNotificationAsSent(notification.id, false, result.error);
          errorCount++;
          console.error(
            `❌ Failed to send notification ${notification.id}: ${result.error}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing notification ${notification.id}:`,
          error
        );
        await markNotificationAsSent(
          notification.id,
          false,
          error instanceof Error ? error.message : "Unknown error"
        );
        errorCount++;
      }
    }

    console.log(
      `📊 Push notification summary: ${sentCount} sent, ${errorCount} failed`
    );

    return {
      success: true,
      sent: sentCount,
      failed: errorCount,
      message: `${sentCount}개 알림 발송 완료, ${errorCount}개 실패`,
    };
  } catch (error) {
    console.error("❌ Failed to send pending notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// NOTE: 특정 사용자에게 즉시 알림 발송
export async function sendImmediateNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    priority?: "low" | "normal" | "high" | "urgent";
  }
) {
  try {
    // 사용자 구독 정보 가져오기
    const result = await sql`
      SELECT push_subscription 
      FROM user_notification_settings 
      WHERE user_id = ${userId}
        AND push_subscription IS NOT NULL
        AND push_subscription != ''
    `;

    if (result.rows.length === 0) {
      return { success: false, error: "사용자 구독 정보를 찾을 수 없습니다" };
    }

    const subscription = JSON.parse(result.rows[0].push_subscription);

    const pushResult = await sendPushNotification(subscription, notification);

    if (pushResult.success) {
      console.log(`✅ Immediate notification sent to user ${userId}`);
    }

    return pushResult;
  } catch (error) {
    console.error("❌ Failed to send immediate notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
