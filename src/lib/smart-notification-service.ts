'use server';

import { sql } from './db';
import { ActivityWithLastMove, FrequencyUnit } from './actions';
import { createNotification } from './notifications';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import * as Sentry from '@sentry/nextjs';

// dayjs 플러그인 초기화
dayjs.extend(utc);
dayjs.extend(timezone);

// NOTE: 한국 시간대 설정
const KST = 'Asia/Seoul';

// NOTE: 알림 정책 인터페이스
interface NotificationPolicy {
  unit: FrequencyUnit;
  thresholds: {
    percentage: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    message: string;
  }[];
}

// NOTE: 주기별 알림 정책 정의
const NOTIFICATION_POLICIES: NotificationPolicy[] = [
  {
    unit: 'days',
    thresholds: [
      {
        percentage: 100, // 당일 23시
        priority: 'high',
        message: '오늘 예정된 활동이 아직 완료되지 않았습니다.',
      },
    ],
  },
  {
    unit: 'weeks',
    thresholds: [
      {
        percentage: 80, // 주기의 80% 경과
        priority: 'normal',
        message: '주간 활동 마감일이 다가오고 있습니다.',
      },
      {
        percentage: 95, // 주기의 95% 경과
        priority: 'high',
        message: '주간 활동이 거의 마감되었습니다.',
      },
    ],
  },
  {
    unit: 'months',
    thresholds: [
      {
        percentage: 85, // 월간 활동 85% 경과
        priority: 'normal',
        message: '월간 활동 마감일이 다가오고 있습니다.',
      },
      {
        percentage: 95, // 월간 활동 95% 경과
        priority: 'high',
        message: '월간 활동이 거의 마감되었습니다.',
      },
    ],
  },
  {
    unit: 'quarters',
    thresholds: [
      {
        percentage: 80, // 분기별 활동 80% 경과
        priority: 'normal',
        message: '분기별 활동 마감일이 다가오고 있습니다.',
      },
      {
        percentage: 90, // 분기별 활동 90% 경과
        priority: 'high',
        message: '분기별 활동이 거의 마감되었습니다.',
      },
    ],
  },
  {
    unit: 'years',
    thresholds: [
      {
        percentage: 90, // 연간 활동 90% 경과 (약 10달 후)
        priority: 'normal',
        message: '연간 활동 마감일이 다가오고 있습니다.',
      },
      {
        percentage: 95, // 연간 활동 95% 경과 (약 11달 후)
        priority: 'high',
        message: '연간 활동이 거의 마감되었습니다.',
      },
    ],
  },
];

// NOTE: 정기 알림 시간 (KST)
const REGULAR_NOTIFICATION_TIMES = [
  { hour: 19, minute: 0 }, // 오후 7시
  { hour: 21, minute: 0 }, // 오후 9시
  { hour: 23, minute: 0 }, // 오후 11시
];

// NOTE: 주기를 시간(밀리초)으로 변환
function getFrequencyInHours(value: number, unit: FrequencyUnit): number {
  const hoursPerUnit = {
    days: 24,
    weeks: 24 * 7,
    months: 24 * 30, // 평균 30일
    quarters: 24 * 90, // 평균 90일
    years: 24 * 365, // 평균 365일
  };

  return value * hoursPerUnit[unit];
}

// NOTE: 활동의 임박도 계산 (0-100%)
function calculateUrgencyPercentage(
  lastExecutedAt: string | null,
  frequencyValue: number,
  frequencyUnit: FrequencyUnit,
): number {
  if (!lastExecutedAt) {
    return 100; // 한 번도 실행하지 않은 경우 100%
  }

  const lastExecuted = dayjs(lastExecutedAt).tz(KST);
  const now = dayjs().tz(KST);
  const hoursSinceLastExecution = now.diff(lastExecuted, 'hour', true);

  const frequencyInHours = getFrequencyInHours(frequencyValue, frequencyUnit);
  const urgencyPercentage = (hoursSinceLastExecution / frequencyInHours) * 100;

  return Math.min(100, Math.max(0, urgencyPercentage));
}

// NOTE: 활동별 알림 필요 여부 판단
function shouldNotifyForActivity(
  activity: ActivityWithLastMove,
  currentTime: dayjs.Dayjs,
): {
  shouldNotify: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message: string;
  urgencyPercentage: number;
} | null {
  const urgencyPercentage = calculateUrgencyPercentage(
    activity.last_executed_at,
    activity.frequency_value,
    activity.frequency_unit,
  );

  // 해당 주기 유형의 정책 찾기
  const policy = NOTIFICATION_POLICIES.find(
    (p) => p.unit === activity.frequency_unit,
  );

  if (!policy) {
    return null;
  }

  // 임계값 확인
  for (const threshold of policy.thresholds.sort(
    (a, b) => b.percentage - a.percentage,
  )) {
    if (urgencyPercentage >= threshold.percentage) {
      // 일단위 활동의 경우 시간 체크
      if (activity.frequency_unit === 'days') {
        const currentHour = currentTime.hour();
        // 오후 11시 이후에만 알림
        if (currentHour >= 23) {
          return {
            shouldNotify: true,
            priority: threshold.priority,
            message: threshold.message,
            urgencyPercentage,
          };
        }
      } else {
        return {
          shouldNotify: true,
          priority: threshold.priority,
          message: threshold.message,
          urgencyPercentage,
        };
      }
    }
  }

  return null;
}

// NOTE: 알림 메시지 생성
function generateNotificationMessage(
  activity: ActivityWithLastMove,
  urgencyPercentage: number,
  baseMessage: string,
): {
  title: string;
  body: string;
  data: Record<string, unknown>;
} {
  const frequencyText = `${activity.frequency_value}${getFrequencyUnitText(
    activity.frequency_unit,
  )}`;

  const daysSinceLastExecution = activity.last_executed_at
    ? dayjs().diff(dayjs(activity.last_executed_at), 'day')
    : '처음';

  const title = `${activity.title} 알림`;
  const body = `${baseMessage} (${frequencyText} 주기, ${daysSinceLastExecution}일 경과)`;

  return {
    title,
    body,
    data: {
      activityId: activity.id,
      urgencyPercentage,
      frequencyText,
      daysSinceLastExecution,
      type: 'activity_reminder',
    },
  };
}

// NOTE: 주기 단위 텍스트 변환
function getFrequencyUnitText(unit: FrequencyUnit): string {
  const unitTexts = {
    days: '일',
    weeks: '주',
    months: '달',
    quarters: '분기',
    years: '년',
  };
  return unitTexts[unit];
}

// NOTE: 모든 사용자의 알림 대상 활동 분석
export async function analyzeNotificationTargets(): Promise<{
  success: boolean;
  message: string;
  analyzedActivities: number;
  notificationTargets: number;
}> {
  Sentry.addBreadcrumb({
    message: 'Starting notification targets analysis',
    category: 'smart-notification',
    level: 'info',
  });

  try {
    const currentTime = dayjs().tz(KST);

    // 모든 활성 사용자의 활동 가져오기
    const activitiesResult = await sql`
      SELECT 
        a.id,
        a.title,
        a.category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.sort_order as category_sort_order,
        a.description,
        a.user_id,
        COALESCE(a.frequency_type, 'preset') as frequency_type,
        COALESCE(a.frequency_value, 1) as frequency_value,
        COALESCE(a.frequency_unit, 'days') as frequency_unit,
        MAX(m.executed_at) as last_executed_at,
        COUNT(m.id) as move_count,
        MAX(DATE(m.executed_at)) as last_move_date
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN moves m ON a.id = m.activity_id
      WHERE a.is_active = true
      GROUP BY a.id, a.title, a.category_id, c.name, c.icon, c.sort_order, a.description, a.user_id, a.frequency_type, a.frequency_value, a.frequency_unit
      ORDER BY a.user_id, a.id
    `;

    const activities = activitiesResult.rows as (ActivityWithLastMove & {
      user_id: number;
    })[];

    let notificationTargets = 0;
    const notificationsToCreate = [];

    // 각 활동별로 알림 필요 여부 분석
    for (const activity of activities) {
      const notificationCheck = shouldNotifyForActivity(activity, currentTime);

      if (notificationCheck?.shouldNotify) {
        const messageData = generateNotificationMessage(
          activity,
          notificationCheck.urgencyPercentage,
          notificationCheck.message,
        );

        notificationsToCreate.push({
          userId: activity.user_id.toString(),
          activityId: activity.id,
          type: 'daily_reminder' as const,
          priority: notificationCheck.priority,
          title: messageData.title,
          body: messageData.body,
          data: messageData.data,
          scheduledAt: currentTime.toISOString(),
        });

        notificationTargets++;
      }
    }

    // 알림 생성
    for (const notification of notificationsToCreate) {
      await createNotification(notification);
    }

    Sentry.addBreadcrumb({
      message: 'Notification targets analysis completed',
      category: 'smart-notification',
      level: 'info',
      data: {
        analyzedActivities: activities.length,
        notificationTargets,
      },
    });

    return {
      success: true,
      message: `${activities.length}개 활동 분석 완료, ${notificationTargets}개 알림 생성`,
      analyzedActivities: activities.length,
      notificationTargets,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'smart-notification-service',
        action: 'analyzeNotificationTargets',
      },
    });

    return {
      success: false,
      message: `알림 분석 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`,
      analyzedActivities: 0,
      notificationTargets: 0,
    };
  }
}

// NOTE: 정기 알림 시간 체크 (매시간 실행)
export async function checkScheduledNotifications(): Promise<{
  success: boolean;
  message: string;
  currentTime: string;
  isRegularTime: boolean;
  nextRegularTime: string | null;
}> {
  const currentTime = dayjs().tz(KST);
  const currentHour = currentTime.hour();
  const currentMinute = currentTime.minute();

  // 정기 알림 시간인지 확인
  const isRegularTime = REGULAR_NOTIFICATION_TIMES.some(
    (time) =>
      time.hour === currentHour && Math.abs(time.minute - currentMinute) <= 5,
  );

  // 다음 정기 알림 시간 계산
  const nextRegularTime = getNextRegularNotificationTime(currentTime);

  if (isRegularTime) {
    // 정기 알림 시간이면 분석 실행
    const result = await analyzeNotificationTargets();
    return {
      success: result.success,
      message: `정기 알림 시간 (${currentTime.format('HH:mm')}): ${
        result.message
      }`,
      currentTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
      isRegularTime: true,
      nextRegularTime: nextRegularTime?.format('YYYY-MM-DD HH:mm:ss') || null,
    };
  } else {
    // 정기 알림 시간이 아니면 대기
    return {
      success: true,
      message: `정기 알림 시간 아님 (${currentTime.format('HH:mm')}), 대기 중`,
      currentTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
      isRegularTime: false,
      nextRegularTime: nextRegularTime?.format('YYYY-MM-DD HH:mm:ss') || null,
    };
  }
}

// NOTE: 다음 정기 알림 시간 계산
function getNextRegularNotificationTime(currentTime: dayjs.Dayjs): dayjs.Dayjs {
  const today = currentTime.startOf('day');

  // 오늘의 알림 시간들 중 현재 시간 이후의 것 찾기
  for (const time of REGULAR_NOTIFICATION_TIMES) {
    const todayTime = today.hour(time.hour).minute(time.minute);
    if (todayTime.isAfter(currentTime)) {
      return todayTime;
    }
  }

  // 오늘 남은 알림 시간이 없으면 내일 첫 번째 알림 시간
  const tomorrow = today.add(1, 'day');
  const firstTime = REGULAR_NOTIFICATION_TIMES[0];
  return tomorrow.hour(firstTime.hour).minute(firstTime.minute);
}

// NOTE: 사용자별 알림 통계 조회
export async function getUserNotificationStats(userId: string): Promise<{
  totalNotifications: number;
  sentNotifications: number;
  clickedNotifications: number;
  pendingNotifications: number;
  recentNotifications: Array<{
    id: number;
    title: string;
    body: string;
    type: string;
    priority: string;
    created_at: string;
    sent_at: string | null;
    clicked_at: string | null;
  }>;
}> {
  try {
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_sent = true THEN 1 END) as sent_notifications,
        COUNT(CASE WHEN is_clicked = true THEN 1 END) as clicked_notifications,
        COUNT(CASE WHEN is_sent = false AND scheduled_at <= NOW() THEN 1 END) as pending_notifications
      FROM notifications
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    const recentResult = await sql`
      SELECT id, title, body, type, priority, created_at, sent_at, clicked_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const stats = statsResult.rows[0];

    return {
      totalNotifications: parseInt(stats.total_notifications || '0'),
      sentNotifications: parseInt(stats.sent_notifications || '0'),
      clickedNotifications: parseInt(stats.clicked_notifications || '0'),
      pendingNotifications: parseInt(stats.pending_notifications || '0'),
      recentNotifications: recentResult.rows,
    };
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    return {
      totalNotifications: 0,
      sentNotifications: 0,
      clickedNotifications: 0,
      pendingNotifications: 0,
      recentNotifications: [],
    };
  }
}

// NOTE: 수동 알림 트리거 (테스트용)
export async function triggerManualNotificationCheck(): Promise<{
  success: boolean;
  message: string;
  result: Awaited<ReturnType<typeof analyzeNotificationTargets>>;
}> {
  Sentry.addBreadcrumb({
    message: 'Manual notification check triggered',
    category: 'smart-notification',
    level: 'info',
  });

  try {
    const result = await analyzeNotificationTargets();
    return {
      success: true,
      message: '수동 알림 검사 완료',
      result,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'smart-notification-service',
        action: 'triggerManualNotificationCheck',
      },
    });

    return {
      success: false,
      message: `수동 알림 검사 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      result: {
        success: false,
        message: '실패',
        analyzedActivities: 0,
        notificationTargets: 0,
      },
    };
  }
}
