import { NextRequest, NextResponse } from 'next/server';
import {
  sendPendingNotifications,
  sendImmediateNotification,
} from '@/lib/push-service';
import { auth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

// NOTE: 대기 중인 알림 발송
export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({
    message: 'Notification send API request',
    category: 'api',
    level: 'info',
    data: {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
    },
  });

  try {
    const requestBody = await request.json();

    const { type, notification } = requestBody;

    Sentry.addBreadcrumb({
      message: 'Request body parsed',
      category: 'api',
      level: 'info',
      data: {
        type,
        hasNotification: !!notification,
      },
    });

    if (type === 'pending') {
      Sentry.addBreadcrumb({
        message: 'Processing pending notifications',
        category: 'api',
        level: 'info',
      });

      // 대기 중인 모든 알림 발송
      const result = await sendPendingNotifications();

      Sentry.addBreadcrumb({
        message: 'Pending notifications processed',
        category: 'api',
        level: 'info',
        data: result,
      });

      return NextResponse.json(result);
    } else if (type === 'immediate' && notification) {
      Sentry.addBreadcrumb({
        message: 'Processing immediate notification',
        category: 'api',
        level: 'info',
      });

      // 세션에서 user_id 가져오기
      Sentry.addBreadcrumb({
        message: 'Checking user authentication',
        category: 'api',
        level: 'debug',
      });

      const session = await auth();

      Sentry.addBreadcrumb({
        message: 'Authentication check completed',
        category: 'api',
        level: 'debug',
        data: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
          userEmail: session?.user?.email || 'not available',
        },
      });

      if (!session?.user?.id) {
        Sentry.captureMessage('Unauthorized immediate notification request', {
          level: 'warning',
          extra: {
            sessionExists: !!session,
            userExists: !!session?.user,
            userIdExists: !!session?.user?.id,
          },
        });
        return NextResponse.json(
          { success: false, error: '인증되지 않은 사용자입니다' },
          { status: 401 },
        );
      }

      const userId = session.user.id;

      Sentry.setUser({
        id: userId,
        email: session.user.email || undefined,
      });
      Sentry.addBreadcrumb({
        message: 'User authenticated for immediate notification',
        category: 'api',
        level: 'info',
        data: {
          userId,
          userEmail: session.user.email,
          notificationTitle: notification.title,
        },
      });

      // 즉시 알림 발송
      Sentry.addBreadcrumb({
        message: 'Calling sendImmediateNotification',
        category: 'api',
        level: 'debug',
        data: {
          userId,
          notificationData: {
            title: notification.title,
            body: notification.body,
            priority: notification.priority,
          },
        },
      });

      const result = await sendImmediateNotification(userId, notification);

      Sentry.addBreadcrumb({
        message: 'Immediate notification processed',
        category: 'api',
        level: 'info',
        data: {
          result,
          success: result.success,
          error: result.error || 'none',
        },
      });

      // 결과에 따른 추가 디버그 로깅
      if (result.success) {
        Sentry.addBreadcrumb({
          message: 'Notification API returning success',
          category: 'api',
          level: 'debug',
          data: {
            userId,
            notificationTitle: notification.title,
            resultData: result,
          },
        });

        // 상세한 성공 응답 반환
        return NextResponse.json({
          success: true,
          message: '즉시 알림이 성공적으로 발송되었습니다',
          userId,
          notificationTitle: notification.title,
          statusCode: (result as any).statusCode || null,
          timestamp: new Date().toISOString(),
        });
      } else {
        Sentry.captureMessage('Immediate notification failed', {
          level: 'error',
          tags: {
            component: 'api-route',
            action: 'immediate-notification',
          },
          extra: {
            userId,
            notificationTitle: notification.title,
            error: result.error,
            fullResult: result,
          },
        });

        // 상세한 실패 응답 반환
        return NextResponse.json({
          success: false,
          error: result.error || '알림 발송에 실패했습니다',
          userId,
          notificationTitle: notification.title,
          statusCode: (result as any).statusCode || null,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json(result);
    } else {
      Sentry.captureMessage('Invalid notification request format', {
        level: 'warning',
        extra: {
          type,
          hasNotification: !!notification,
        },
      });

      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다' },
        { status: 400 },
      );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: 'notifications-send',
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
      { status: 500 },
    );
  }
}

// NOTE: 알림 발송 상태 조회
export async function GET() {
  try {
    // 간단한 상태 정보 반환
    return NextResponse.json({
      success: true,
      message: '알림 발송 서비스가 활성화되어 있습니다',
      vapidConfigured: !!(
        process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: 'notifications-status',
      },
    });
    return NextResponse.json(
      { success: false, error: '상태 조회에 실패했습니다' },
      { status: 500 },
    );
  }
}
