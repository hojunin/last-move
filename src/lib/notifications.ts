"use server";

import { sql } from "./db";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";

// NOTE: 알림 관련 타입 정의
export interface NotificationSettings {
  id: number;
  user_id: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  weekly_reminder_enabled: boolean;
  weekly_reminder_day: number;
  weekly_reminder_time: string;
  long_inactive_enabled: boolean;
  long_inactive_days: number;
  streak_celebration_enabled: boolean;
  goal_achievement_enabled: boolean;
  push_subscription: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  activity_id: number | null;
  type:
    | "daily_reminder"
    | "weekly_reminder"
    | "long_inactive"
    | "streak_celebration"
    | "goal_achievement"
    | "encouragement"
    | "custom";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: Record<string, unknown>;
  scheduled_at: string;
  sent_at: string | null;
  read_at: string | null;
  clicked_at: string | null;
  is_sent: boolean;
  is_read: boolean;
  is_clicked: boolean;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

// NOTE: 사용자 알림 설정 가져오기
export async function getNotificationSettings(
  userId: string = "default_user"
): Promise<NotificationSettings | null> {
  try {
    const result = await sql`
      SELECT * FROM user_notification_settings 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    return (result.rows[0] as NotificationSettings) || null;
  } catch (error) {
    console.error("Failed to get notification settings:", error);
    return null;
  }
}

// NOTE: 알림 설정 업데이트
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
  userId: string = "default_user"
) {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(settings)) {
      if (
        key !== "id" &&
        key !== "user_id" &&
        key !== "created_at" &&
        key !== "updated_at"
      ) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return { success: false, error: "업데이트할 설정이 없습니다" };
    }

    values.push(userId);
    const query = `
      UPDATE user_notification_settings 
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE user_id = $${paramIndex}
    `;

    await sql.query(query, values);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to update notification settings:", error);
    return { success: false, error: "알림 설정 업데이트에 실패했습니다" };
  }
}

// NOTE: 푸시 구독 정보 저장
export async function savePushSubscription(
  subscription: Record<string, unknown>,
  userId: string = "default_user"
) {
  try {
    await sql`
      UPDATE user_notification_settings 
      SET push_subscription = ${JSON.stringify(
        subscription
      )}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return { success: false, error: "푸시 구독 저장에 실패했습니다" };
  }
}

// NOTE: 알림 생성
export async function createNotification({
  activityId,
  type,
  priority = "normal",
  title,
  body,
  scheduledAt,
  data = {},
  userId = "default_user",
}: {
  activityId?: number;
  type: Notification["type"];
  priority?: Notification["priority"];
  title: string;
  body: string;
  scheduledAt: Date | string;
  data?: Record<string, unknown>;
  userId?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO notifications (
        user_id, activity_id, type, priority, title, body, data, scheduled_at
      ) VALUES (
        ${userId}, ${
      activityId || null
    }, ${type}, ${priority}, ${title}, ${body}, 
        ${JSON.stringify(data)}, ${dayjs(scheduledAt).toISOString()}
      )
      RETURNING id
    `;

    return { success: true, notificationId: result.rows[0].id };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "알림 생성에 실패했습니다" };
  }
}

// NOTE: 일일 리마인더 알림 생성 (오늘 미완료 활동)
export async function createDailyReminders() {
  try {
    const settings = await getNotificationSettings();
    if (!settings?.daily_reminder_enabled) {
      return {
        success: true,
        message: "일일 리마인더가 비활성화되어 있습니다",
      };
    }

    // 오늘 완료되지 않은 활동 찾기
    const today = dayjs().format("YYYY-MM-DD");
    const incompleteTasks = await sql`
      SELECT a.id, a.title, a.category
      FROM activities a
      LEFT JOIN moves m ON a.id = m.activity_id 
        AND DATE(m.executed_at) = ${today}
      WHERE a.is_active = true
        AND m.id IS NULL
    `;

    if (incompleteTasks.rows.length === 0) {
      return { success: true, message: "모든 활동이 완료되었습니다" };
    }

    // 알림 발송 시간 계산 (설정된 시간)
    const reminderTime =
      dayjs().format("YYYY-MM-DD") + " " + settings.daily_reminder_time;
    const scheduledAt = dayjs(reminderTime);

    // 이미 지난 시간이면 내일로 설정
    if (scheduledAt.isBefore(dayjs())) {
      return { success: true, message: "오늘 알림 시간이 이미 지났습니다" };
    }

    const createdNotifications = [];

    for (const task of incompleteTasks.rows) {
      const result = await createNotification({
        activityId: task.id,
        type: "daily_reminder",
        priority: "normal",
        title: "📅 일일 리마인더",
        body: `"${task.title}"을(를) 오늘 완료하지 않으셨네요. 하루를 마무리하기 전에 해보는 건 어떨까요?`,
        scheduledAt: scheduledAt.toDate(),
        data: {
          activity: {
            id: task.id,
            title: task.title,
            category: task.category,
          },
        },
      });

      if (result.success) {
        createdNotifications.push(result.notificationId);
      }
    }

    return {
      success: true,
      message: `${createdNotifications.length}개의 일일 리마인더를 생성했습니다`,
      notificationIds: createdNotifications,
    };
  } catch (error) {
    console.error("Failed to create daily reminders:", error);
    return { success: false, error: "일일 리마인더 생성에 실패했습니다" };
  }
}

// NOTE: 장기 미실행 알림 생성
export async function createLongInactiveReminders() {
  try {
    const settings = await getNotificationSettings();
    if (!settings?.long_inactive_enabled) {
      return {
        success: true,
        message: "장기 미실행 알림이 비활성화되어 있습니다",
      };
    }

    const inactiveDays = settings.long_inactive_days;
    const cutoffDate = dayjs()
      .subtract(inactiveDays, "day")
      .format("YYYY-MM-DD");

    // 장기간 미실행 활동 찾기
    const inactiveTasks = await sql`
      SELECT a.id, a.title, a.category, 
             MAX(m.executed_at) as last_executed_at,
             EXTRACT(DAY FROM NOW() - MAX(m.executed_at)) as days_since_last
      FROM activities a
      LEFT JOIN moves m ON a.id = m.activity_id
      WHERE a.is_active = true
      GROUP BY a.id, a.title, a.category
      HAVING MAX(m.executed_at) < ${cutoffDate} OR MAX(m.executed_at) IS NULL
    `;

    if (inactiveTasks.rows.length === 0) {
      return { success: true, message: "장기 미실행 활동이 없습니다" };
    }

    const createdNotifications = [];
    const scheduledAt = dayjs().add(1, "hour"); // 1시간 후 발송

    for (const task of inactiveTasks.rows) {
      const daysSince = Math.floor(task.days_since_last) || "기록 없음";

      const result = await createNotification({
        activityId: task.id,
        type: "long_inactive",
        priority: "normal",
        title: "💪 다시 시작해보세요!",
        body: `"${task.title}"을(를) ${daysSince}일째 하지 않으셨네요. 작은 시작이 큰 변화를 만듭니다!`,
        scheduledAt: scheduledAt.toDate(),
        data: {
          activity: {
            id: task.id,
            title: task.title,
            category: task.category,
          },
          days_since_last: daysSince,
        },
      });

      if (result.success) {
        createdNotifications.push(result.notificationId);
      }
    }

    return {
      success: true,
      message: `${createdNotifications.length}개의 장기 미실행 알림을 생성했습니다`,
      notificationIds: createdNotifications,
    };
  } catch (error) {
    console.error("Failed to create long inactive reminders:", error);
    return { success: false, error: "장기 미실행 알림 생성에 실패했습니다" };
  }
}

// NOTE: 연속 기록 축하 알림 생성
export async function createStreakCelebrationNotifications() {
  try {
    const settings = await getNotificationSettings();
    if (!settings?.streak_celebration_enabled) {
      return {
        success: true,
        message: "연속 기록 축하 알림이 비활성화되어 있습니다",
      };
    }

    // 각 활동의 연속 기록 계산
    const streakQuery = await sql`
      WITH daily_completions AS (
        SELECT 
          a.id,
          a.title,
          DATE(m.executed_at) as completion_date
        FROM activities a
        JOIN moves m ON a.id = m.activity_id
        WHERE a.is_active = true
          AND m.executed_at >= NOW() - INTERVAL '30 days'
        GROUP BY a.id, a.title, DATE(m.executed_at)
        ORDER BY a.id, completion_date DESC
      ),
      streak_calculation AS (
        SELECT 
          id,
          title,
          completion_date,
          ROW_NUMBER() OVER (PARTITION BY id ORDER BY completion_date DESC) as row_num,
          completion_date + INTERVAL '1 day' * ROW_NUMBER() OVER (PARTITION BY id ORDER BY completion_date DESC) as expected_date
        FROM daily_completions
      )
      SELECT 
        id,
        title,
        COUNT(*) as current_streak
      FROM streak_calculation
      WHERE completion_date = expected_date - INTERVAL '1 day' * row_num
      GROUP BY id, title
      HAVING COUNT(*) IN (3, 7, 30) -- 3일, 7일, 30일 연속
    `;

    if (streakQuery.rows.length === 0) {
      return { success: true, message: "축하할 연속 기록이 없습니다" };
    }

    const createdNotifications = [];
    const scheduledAt = dayjs().add(5, "minute"); // 5분 후 즉시 발송

    for (const streak of streakQuery.rows) {
      const streakDays = streak.current_streak;
      let title, body;

      if (streakDays === 3) {
        title = "🔥 3일 연속 달성!";
        body = `"${streak.title}"을(를) 3일 연속 완료하셨네요! 좋은 습관이 만들어지고 있어요!`;
      } else if (streakDays === 7) {
        title = "🏆 1주일 연속 달성!";
        body = `"${streak.title}"을(를) 일주일 연속 완료! 정말 대단해요! 이 습관을 계속 유지해보세요!`;
      } else if (streakDays === 30) {
        title = "🎉 30일 연속 달성!";
        body = `"${streak.title}"을(를) 한 달 연속 완료! 이제 완전한 습관이 되었네요! 축하드려요!`;
      }

      const result = await createNotification({
        activityId: streak.id,
        type: "streak_celebration",
        priority: "high",
        title: title!,
        body: body!,
        scheduledAt: scheduledAt.toDate(),
        data: {
          activity: {
            id: streak.id,
            title: streak.title,
          },
          streak_days: streakDays,
        },
      });

      if (result.success) {
        createdNotifications.push(result.notificationId);
      }
    }

    return {
      success: true,
      message: `${createdNotifications.length}개의 연속 기록 축하 알림을 생성했습니다`,
      notificationIds: createdNotifications,
    };
  } catch (error) {
    console.error("Failed to create streak celebration notifications:", error);
    return { success: false, error: "연속 기록 축하 알림 생성에 실패했습니다" };
  }
}

// NOTE: 발송 대기 중인 알림 가져오기
export async function getPendingNotifications(): Promise<Notification[]> {
  try {
    const result = await sql`
      SELECT * FROM notifications 
      WHERE is_sent = false 
        AND scheduled_at <= NOW()
        AND retry_count < 3
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 50
    `;

    return result.rows as Notification[];
  } catch (error) {
    console.error("Failed to get pending notifications:", error);
    return [];
  }
}

// NOTE: 알림 발송 완료 표시
export async function markNotificationAsSent(
  notificationId: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    if (success) {
      await sql`
        UPDATE notifications 
        SET is_sent = true, sent_at = NOW()
        WHERE id = ${notificationId}
      `;
    } else {
      await sql`
        UPDATE notifications 
        SET retry_count = retry_count + 1, error_message = ${
          errorMessage || null
        }
        WHERE id = ${notificationId}
      `;
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as sent:", error);
    return { success: false, error: "알림 상태 업데이트에 실패했습니다" };
  }
}
