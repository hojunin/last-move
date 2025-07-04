import { NextRequest, NextResponse } from "next/server";
import {
  sendPendingNotifications,
  sendImmediateNotification,
} from "@/lib/push-service";
import { auth } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

// NOTE: 대기 중인 알림 발송
export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({
    message: "Notification send API request",
    category: "api",
    level: "info",
    data: {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get("user-agent"),
    },
  });

  try {
    const requestBody = await request.json();

    const { type, notification } = requestBody;

    Sentry.addBreadcrumb({
      message: "Request body parsed",
      category: "api",
      level: "info",
      data: {
        type,
        hasNotification: !!notification,
      },
    });

    if (type === "pending") {
      Sentry.addBreadcrumb({
        message: "Processing pending notifications",
        category: "api",
        level: "info",
      });

      // 대기 중인 모든 알림 발송
      const result = await sendPendingNotifications();

      Sentry.addBreadcrumb({
        message: "Pending notifications processed",
        category: "api",
        level: "info",
        data: result,
      });

      return NextResponse.json(result);
    } else if (type === "immediate" && notification) {
      Sentry.addBreadcrumb({
        message: "Processing immediate notification",
        category: "api",
        level: "info",
      });

      // 세션에서 user_id 가져오기
      const session = await auth();

      if (!session?.user?.id) {
        Sentry.captureMessage("Unauthorized immediate notification request", {
          level: "warning",
        });
        return NextResponse.json(
          { success: false, error: "인증되지 않은 사용자입니다" },
          { status: 401 }
        );
      }

      const userId = session.user.id;

      Sentry.setUser({ id: userId });
      Sentry.addBreadcrumb({
        message: "User authenticated for immediate notification",
        category: "api",
        level: "info",
        data: { userId },
      });

      // 즉시 알림 발송
      const result = await sendImmediateNotification(userId, notification);

      Sentry.addBreadcrumb({
        message: "Immediate notification processed",
        category: "api",
        level: "info",
        data: result,
      });

      return NextResponse.json(result);
    } else {
      Sentry.captureMessage("Invalid notification request format", {
        level: "warning",
        extra: {
          type,
          hasNotification: !!notification,
        },
      });

      return NextResponse.json(
        { success: false, error: "잘못된 요청 형식입니다" },
        { status: 400 }
      );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: "notifications-send",
      },
      extra: {
        url: request.url,
        method: request.method,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: `알림 발송에 실패했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

// NOTE: 알림 발송 상태 조회
export async function GET() {
  try {
    // 간단한 상태 정보 반환
    return NextResponse.json({
      success: true,
      message: "알림 발송 서비스가 활성화되어 있습니다",
      vapidConfigured: !!(
        process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: "notifications-status",
      },
    });
    return NextResponse.json(
      { success: false, error: "상태 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
