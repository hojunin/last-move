import { NextRequest, NextResponse } from 'next/server';
import {
  checkScheduledNotifications,
  triggerManualNotificationCheck,
  getUserNotificationStats,
} from '@/lib/smart-notification-service';
import { sendPendingNotifications } from '@/lib/push-service';
import { auth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

// NOTE: 스마트 알림 체크 API
export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({
    message: 'Smart notification check API called',
    category: 'api',
    level: 'info',
    data: {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
    },
  });

  try {
    const body = await request.json();
    const { action, userId } = body;

    Sentry.addBreadcrumb({
      message: 'Smart notification request parsed',
      category: 'api',
      level: 'info',
      data: {
        action,
        userId,
      },
    });

    switch (action) {
      case 'check':
        // 정기 알림 시간 체크 및 분석
        const checkResult = await checkScheduledNotifications();

        if (checkResult.isRegularTime && checkResult.success) {
          // 정기 알림 시간이면 대기 중인 알림 발송
          const sendResult = await sendPendingNotifications();

          return NextResponse.json({
            success: true,
            checkResult,
            sendResult,
            message: '정기 알림 체크 및 발송 완료',
          });
        } else {
          return NextResponse.json({
            success: true,
            checkResult,
            message: '정기 알림 체크 완료',
          });
        }

      case 'trigger':
        // 수동 알림 트리거
        const triggerResult = await triggerManualNotificationCheck();

        if (triggerResult.success) {
          // 알림 생성 후 즉시 발송
          const sendResult = await sendPendingNotifications();

          return NextResponse.json({
            success: true,
            triggerResult,
            sendResult,
            message: '수동 알림 트리거 및 발송 완료',
          });
        } else {
          return NextResponse.json({
            success: false,
            triggerResult,
            message: '수동 알림 트리거 실패',
          });
        }

      case 'stats':
        // 사용자 알림 통계 조회
        if (!userId) {
          return NextResponse.json(
            { success: false, error: '사용자 ID가 필요합니다' },
            { status: 400 },
          );
        }

        const stats = await getUserNotificationStats(userId);

        return NextResponse.json({
          success: true,
          stats,
          message: '알림 통계 조회 완료',
        });

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 액션입니다' },
          { status: 400 },
        );
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'smart-notification-api',
        action: 'POST',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: `스마트 알림 처리 중 오류 발생: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 },
    );
  }
}

// NOTE: 사용자별 알림 통계 조회 (GET)
export async function GET(request: NextRequest) {
  Sentry.addBreadcrumb({
    message: 'Smart notification stats API called',
    category: 'api',
    level: 'info',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const stats = await getUserNotificationStats(userId);

    return NextResponse.json({
      success: true,
      stats,
      message: '알림 통계 조회 완료',
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'smart-notification-api',
        action: 'GET',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: `알림 통계 조회 중 오류 발생: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 },
    );
  }
}
