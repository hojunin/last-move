"use server";

import webpush from "web-push";
import { sql } from "./db";
import {
  getPendingNotifications,
  markNotificationAsSent,
} from "./notifications";
import * as Sentry from "@sentry/nextjs";

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
interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: Record<string, unknown> | PushSubscriptionData,
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
  Sentry.addBreadcrumb({
    message: "Starting push notification send",
    category: "push-notification",
    level: "info",
    data: {
      title: payload.title,
      priority: payload.priority || "normal",
      hasNotificationId: !!payload.notificationId,
    },
  });

  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      const error = new Error("VAPID keys not configured");
      Sentry.captureException(error, {
        tags: {
          component: "push-service",
          action: "sendPushNotification",
        },
        extra: {
          hasVapidPublic: !!vapidPublicKey,
          hasVapidPrivate: !!vapidPrivateKey,
        },
      });
      throw error;
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

    const options: webpush.RequestOptions = {
      TTL: 60 * 60 * 24, // 24시간
      urgency:
        payload.priority === "urgent"
          ? ("high" as const)
          : payload.priority === "high"
          ? ("high" as const)
          : payload.priority === "low"
          ? ("low" as const)
          : ("normal" as const),
    };

    // 구독 데이터 타입 검증 및 변환
    const validatedSubscription: webpush.PushSubscription = {
      endpoint: (subscription as PushSubscriptionData).endpoint,
      keys: {
        p256dh: (subscription as PushSubscriptionData).keys.p256dh,
        auth: (subscription as PushSubscriptionData).keys.auth,
      },
    };

    Sentry.addBreadcrumb({
      message: "Sending notification to web push service",
      category: "push-notification",
      level: "info",
      data: {
        endpoint: validatedSubscription.endpoint,
        payloadSize: pushPayload.length,
        ttl: options.TTL,
        urgency: options.urgency,
      },
    });

    const result = await webpush.sendNotification(
      validatedSubscription,
      pushPayload,
      options
    );

    Sentry.addBreadcrumb({
      message: "Push notification sent successfully",
      category: "push-notification",
      level: "info",
      data: {
        statusCode: result.statusCode,
        title: payload.title,
      },
    });

    console.log("✅ Push notification sent successfully:", result.statusCode);
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "push-service",
        action: "sendPushNotification",
      },
      extra: {
        title: payload.title,
        priority: payload.priority,
        endpoint: (subscription as PushSubscriptionData).endpoint,
      },
    });

    console.error("❌ Failed to send push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// NOTE: 대기 중인 모든 알림 발송
export async function sendPendingNotifications() {
  Sentry.addBreadcrumb({
    message: "Starting pending notifications send",
    category: "push-notification",
    level: "info",
  });

  try {
    console.log("🚀 Checking for pending notifications...");

    Sentry.addBreadcrumb({
      message: "Fetching pending notifications",
      category: "push-notification",
      level: "info",
    });

    const pendingNotifications = await getPendingNotifications();

    if (pendingNotifications.length === 0) {
      Sentry.addBreadcrumb({
        message: "No pending notifications found",
        category: "push-notification",
        level: "info",
      });
      console.log("📭 No pending notifications found");
      return { success: true, sent: 0, message: "발송할 알림이 없습니다" };
    }

    Sentry.addBreadcrumb({
      message: "Pending notifications found",
      category: "push-notification",
      level: "info",
      data: {
        count: pendingNotifications.length,
      },
    });

    console.log(
      `📬 Found ${pendingNotifications.length} pending notifications`
    );

    // 사용자별 구독 정보 가져오기
    Sentry.addBreadcrumb({
      message: "Fetching user subscriptions",
      category: "push-notification",
      level: "info",
    });

    const subscriptions = await sql`
      SELECT user_id, push_subscription 
      FROM user_notification_settings 
      WHERE push_subscription IS NOT NULL
        AND push_subscription != ''
    `;

    if (subscriptions.rows.length === 0) {
      Sentry.addBreadcrumb({
        message: "No active subscriptions found",
        category: "push-notification",
        level: "warning",
      });
      console.log("📭 No active push subscriptions found");
      return { success: true, sent: 0, message: "활성 구독이 없습니다" };
    }

    Sentry.addBreadcrumb({
      message: "Active subscriptions found",
      category: "push-notification",
      level: "info",
      data: {
        subscriptionCount: subscriptions.rows.length,
      },
    });

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

    Sentry.addBreadcrumb({
      message: "Pending notifications processing completed",
      category: "push-notification",
      level: "info",
      data: {
        sentCount,
        errorCount,
        totalProcessed: sentCount + errorCount,
      },
    });

    return {
      success: true,
      sent: sentCount,
      failed: errorCount,
      message: `${sentCount}개 알림 발송 완료, ${errorCount}개 실패`,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "push-service",
        action: "sendPendingNotifications",
      },
    });

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
  Sentry.addBreadcrumb({
    message: "Starting immediate notification send",
    category: "push-notification",
    level: "info",
    data: {
      userId,
      notificationTitle: notification.title,
      priority: notification.priority || "normal",
    },
  });

  try {
    // 사용자 구독 정보 가져오기
    Sentry.addBreadcrumb({
      message: "Fetching user subscription",
      category: "push-notification",
      level: "info",
      data: { userId },
    });

    const result = await sql`
      SELECT push_subscription 
      FROM user_notification_settings 
      WHERE user_id = ${userId}
        AND push_subscription IS NOT NULL
        AND push_subscription != ''
    `;

    if (result.rows.length === 0) {
      Sentry.captureMessage("No subscription found for user", {
        level: "warning",
        tags: {
          component: "push-service",
          action: "sendImmediateNotification",
        },
        extra: {
          userId,
          notificationTitle: notification.title,
        },
      });

      return { success: false, error: "사용자 구독 정보를 찾을 수 없습니다" };
    }

    Sentry.addBreadcrumb({
      message: "User subscription found",
      category: "push-notification",
      level: "info",
      data: {
        userId,
        subscriptionExists: true,
      },
    });

    const subscription = JSON.parse(result.rows[0].push_subscription);

    Sentry.addBreadcrumb({
      message: "Subscription parsed successfully",
      category: "push-notification",
      level: "info",
      data: {
        userId,
        hasEndpoint: !!subscription.endpoint,
        hasKeys: !!(subscription.keys?.p256dh && subscription.keys?.auth),
      },
    });

    const pushResult = await sendPushNotification(subscription, notification);

    if (pushResult.success) {
      Sentry.addBreadcrumb({
        message: "Immediate notification sent successfully",
        category: "push-notification",
        level: "info",
        data: {
          userId,
          notificationTitle: notification.title,
          statusCode: pushResult.statusCode,
        },
      });
      console.log(`✅ Immediate notification sent to user ${userId}`);
    } else {
      Sentry.captureMessage("Failed to send push notification", {
        level: "error",
        tags: {
          component: "push-service",
          action: "sendPushNotification",
        },
        extra: {
          userId,
          notificationTitle: notification.title,
          error: pushResult.error,
        },
      });
    }

    return pushResult;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "push-service",
        action: "sendImmediateNotification",
      },
      extra: {
        userId,
        notificationTitle: notification.title,
        priority: notification.priority,
      },
    });

    console.error("❌ Failed to send immediate notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
