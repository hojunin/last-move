'use server';

import { sql } from './db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// NOTE: 카테고리 타입
export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// NOTE: 활동 주기 타입
export type FrequencyType = 'preset' | 'custom';
export type FrequencyUnit = 'days' | 'weeks' | 'months' | 'quarters' | 'years';

export interface ActivityFrequency {
  type: FrequencyType;
  value: number;
  unit: FrequencyUnit;
}

// NOTE: 활동 정의 타입
export interface Activity {
  id: number;
  title: string;
  category: string | null;
  category_id: number | null;
  description: string | null;
  reminder_rule_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | null;
  reminder_interval: number | null;
  reminder_days_of_week: number[] | null;
  frequency_type: FrequencyType;
  frequency_value: number;
  frequency_unit: FrequencyUnit;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// NOTE: 실행 기록 타입
export interface Move {
  id: number;
  activity_id: number;
  executed_at: string;
  notes: string | null;
  created_at: string;
}

// NOTE: 활동과 최근 실행 정보를 합친 뷰 타입
export interface ActivityWithLastMove {
  id: number;
  title: string;
  category: string | null;
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_sort_order: number | null;
  description: string | null;
  frequency_type: FrequencyType;
  frequency_value: number;
  frequency_unit: FrequencyUnit;
  last_executed_at: string | null;
  move_count: number;
  last_move_date: string | null; // 가장 최근 move의 날짜 (오늘 완료 체크용)
}

// NOTE: 활동 생성을 위한 Zod 스키마
const createActivitySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  category_id: z.number().optional(),
  frequency_type: z.enum(['preset', 'custom']).default('preset'),
  frequency_value: z.number().min(1).default(1),
  frequency_unit: z
    .enum(['days', 'weeks', 'months', 'quarters', 'years'])
    .default('days'),
});

// NOTE: Move 생성을 위한 Zod 스키마 (향후 확장용)
// const createMoveSchema = z.object({
//   activity_id: z.number(),
//   executed_at: z.string().optional(),
//   notes: z.string().optional(),
// });

// NOTE: 카테고리 목록을 가져오는 서버 액션
export async function getCategories(): Promise<Category[]> {
  try {
    const result = await sql`
      SELECT id, name, description, color, icon, sort_order, is_active, created_at, updated_at
      FROM categories 
      WHERE is_active = true 
      ORDER BY sort_order, name
    `;

    return result.rows as Category[];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// NOTE: 모든 활동과 최근 실행 정보를 가져오는 서버 액션 (사용자별)
export async function getActivitiesWithLastMove(): Promise<
  ActivityWithLastMove[]
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No authenticated user found');
      return [];
    }

    const userId = parseInt(session.user.id);
    const result = await sql`
      SELECT 
        a.id,
        a.title,
        a.category,
        a.category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.sort_order as category_sort_order,
        a.description,
        COALESCE(a.frequency_type, 'preset') as frequency_type,
        COALESCE(a.frequency_value, 1) as frequency_value,
        COALESCE(a.frequency_unit, 'days') as frequency_unit,
        MAX(m.executed_at) as last_executed_at,
        COUNT(m.id) as move_count,
        MAX(DATE(m.executed_at)) as last_move_date
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN moves m ON a.id = m.activity_id
      WHERE a.is_active = true AND a.user_id = ${userId}
      GROUP BY a.id, a.title, a.category, a.category_id, c.name, c.icon, c.sort_order, a.description, a.frequency_type, a.frequency_value, a.frequency_unit
      ORDER BY last_executed_at ASC NULLS LAST
    `;

    return result.rows as ActivityWithLastMove[];
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return [];
  }
}

// NOTE: 활동 검색 (자동완성용, 사용자별)
export async function searchActivities(query: string): Promise<Activity[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = parseInt(session.user.id);
    const result = await sql`
      SELECT * FROM activities 
      WHERE is_active = true 
      AND user_id = ${userId}
      AND (title ILIKE ${'%' + query + '%'} OR category ILIKE ${
      '%' + query + '%'
    })
      ORDER BY title
      LIMIT 10
    `;

    return result.rows as Activity[];
  } catch (error) {
    console.error('Failed to search activities:', error);
    return [];
  }
}

// NOTE: 새 활동을 생성하는 서버 액션 (사용자별)
export async function createActivity(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);
    const rawData = {
      title: formData.get('title'),
      category_id: formData.get('category_id')
        ? Number(formData.get('category_id'))
        : null,
      frequency_type:
        (formData.get('frequency_type') as FrequencyType) || 'preset',
      frequency_value: formData.get('frequency_value')
        ? Number(formData.get('frequency_value'))
        : 1,
      frequency_unit:
        (formData.get('frequency_unit') as FrequencyUnit) || 'days',
    };

    const validatedData = createActivitySchema.parse(rawData);

    // 중복 활동 체크
    const existingActivity = await sql`
      SELECT id FROM activities 
      WHERE title = ${validatedData.title} 
      AND user_id = ${userId} 
      AND is_active = true
    `;

    if (existingActivity.rows.length > 0) {
      return { success: false, error: '이미 존재하는 활동입니다' };
    }

    const result = await sql`
      INSERT INTO activities (
        title, 
        category_id,
        user_id
      )
      VALUES (
        ${validatedData.title},
        ${validatedData.category_id},
        ${userId}
      )
      RETURNING id
    `;

    revalidatePath('/');
    return { success: true, activityId: result.rows[0].id };
  } catch (error) {
    console.error('Failed to create activity:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: '활동 생성에 실패했습니다' };
  }
}

// NOTE: 새 Move를 기록하는 서버 액션 (사용자별)
export async function createMove(activityId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 활동입니다' };
    }

    await sql`
      INSERT INTO moves (activity_id, user_id)
      VALUES (${activityId}, ${userId})
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create move:', error);
    return { success: false, error: 'Move 기록에 실패했습니다' };
  }
}

// NOTE: 특정 날짜로 새 Move를 기록하는 서버 액션 (사용자별)
export async function createMoveWithDate(
  activityId: number,
  executedAt: string,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 활동입니다' };
    }

    // 해당 날짜에 이미 기록이 있는지 확인
    const existingMove = await sql`
      SELECT id FROM moves 
      WHERE activity_id = ${activityId} 
      AND user_id = ${userId}
      AND DATE(executed_at) = DATE(${executedAt})
    `;

    if (existingMove.rows.length > 0) {
      return { success: false, error: '해당 날짜에 이미 기록이 있습니다' };
    }

    await sql`
      INSERT INTO moves (activity_id, executed_at, user_id)
      VALUES (${activityId}, ${executedAt}, ${userId})
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create move with date:', error);
    return { success: false, error: 'Move 기록에 실패했습니다' };
  }
}

// NOTE: 활동과 Move를 함께 생성하는 서버 액션
export async function createActivityAndMove(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('인증이 필요합니다');
    }

    const userId = parseInt(session.user.id);
    const title = formData.get('title') as string;
    const categoryId = formData.get('category_id') as string;

    if (!title || !categoryId) {
      throw new Error('모든 필드를 입력해주세요');
    }

    // 중복 활동 체크
    const existingActivity = await sql`
      SELECT id FROM activities 
      WHERE title = ${title} 
      AND user_id = ${userId} 
      AND is_active = true
    `;

    if (existingActivity.rows.length > 0) {
      throw new Error('이미 존재하는 활동입니다');
    }

    // 활동 생성
    const activityResult = await sql`
      INSERT INTO activities (
        title, 
        category_id,
        user_id
      )
      VALUES (
        ${title},
        ${parseInt(categoryId)},
        ${userId}
      )
      RETURNING id
    `;

    const activityId = activityResult.rows[0].id;

    // Move 생성
    await sql`
      INSERT INTO moves (activity_id, user_id)
      VALUES (${activityId}, ${userId})
    `;

    revalidatePath('/');
  } catch (error) {
    console.error('Failed to create activity and move:', error);
    throw error;
  }
}

// NOTE: 기존 호환성을 위한 별칭 (기존 컴포넌트에서 사용)
export const getItems = getActivitiesWithLastMove;
export const logAction = async (activityId: number) =>
  await createMove(activityId);
export type LastMoveItem = ActivityWithLastMove;

// NOTE: Detail 모달용 추가 타입들
export interface ActivityDetail extends Activity {
  category_name: string | null;
  category_icon: string | null;
  move_count: number;
  last_executed_at: string | null;
}

export interface MoveWithDetails extends Move {
  activity_title: string;
}

// NOTE: 특정 활동의 상세 정보를 가져오는 서버 액션
export async function getActivityDetail(
  activityId: number,
): Promise<ActivityDetail | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const userId = parseInt(session.user.id);
    const result = await sql`
      SELECT 
        a.*,
        c.name as category_name,
        c.icon as category_icon,
        COUNT(m.id) as move_count,
        MAX(m.executed_at) as last_executed_at
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN moves m ON a.id = m.activity_id
      WHERE a.id = ${activityId} AND a.user_id = ${userId} AND a.is_active = true
      GROUP BY a.id, c.name, c.icon
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as ActivityDetail;
  } catch (error) {
    console.error('Failed to fetch activity detail:', error);
    return null;
  }
}

// NOTE: 특정 활동의 모든 Move 기록을 가져오는 서버 액션
export async function getActivityMoves(activityId: number): Promise<Move[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return [];
    }

    const result = await sql`
      SELECT id, activity_id, executed_at, notes, created_at
      FROM moves
      WHERE activity_id = ${activityId} AND user_id = ${userId}
      ORDER BY executed_at DESC
    `;

    return result.rows as Move[];
  } catch (error) {
    console.error('Failed to fetch activity moves:', error);
    return [];
  }
}

// NOTE: 활동 정보를 수정하는 서버 액션
const updateActivitySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  category_id: z.number().optional(),
  description: z.string().optional(),
  reminder_rule_type: z
    .enum(['none', 'daily', 'weekly', 'monthly', 'custom'])
    .optional(),
  reminder_interval: z.number().optional(),
  reminder_days_of_week: z.array(z.number()).optional(),
  frequency_type: z.enum(['preset', 'custom']).optional(),
  frequency_value: z.number().min(1).optional(),
  frequency_unit: z
    .enum(['days', 'weeks', 'months', 'quarters', 'years'])
    .optional(),
});

export async function updateActivity(
  activityId: number,
  data: z.infer<typeof updateActivitySchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 활동입니다' };
    }

    const validatedData = updateActivitySchema.parse(data);

    // 동일한 제목의 다른 활동이 있는지 확인 (자신 제외)
    const existingActivity = await sql`
      SELECT id FROM activities 
      WHERE title = ${validatedData.title} 
      AND user_id = ${userId} 
      AND id != ${activityId}
      AND is_active = true
    `;

    if (existingActivity.rows.length > 0) {
      return { success: false, error: '이미 존재하는 활동 제목입니다' };
    }

    await sql`
      UPDATE activities SET
        title = ${validatedData.title},
        category_id = ${validatedData.category_id || null},
        description = ${validatedData.description || null},
        reminder_rule_type = ${validatedData.reminder_rule_type || 'none'},
        reminder_interval = ${validatedData.reminder_interval || null},
        reminder_days_of_week = ${
          validatedData.reminder_days_of_week
            ? JSON.stringify(validatedData.reminder_days_of_week)
            : null
        },
        frequency_type = ${validatedData.frequency_type || 'preset'},
        frequency_value = ${validatedData.frequency_value || 1},
        frequency_unit = ${validatedData.frequency_unit || 'days'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${activityId} AND user_id = ${userId}
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update activity:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: '활동 수정에 실패했습니다' };
  }
}

// NOTE: Move 기록을 수정하는 서버 액션
const updateMoveSchema = z.object({
  executed_at: z.string(),
});

export async function updateMove(
  moveId: number,
  data: z.infer<typeof updateMoveSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 Move가 현재 사용자의 것인지 확인
    const moveCheck = await sql`
      SELECT m.id FROM moves m
      JOIN activities a ON m.activity_id = a.id
      WHERE m.id = ${moveId} AND m.user_id = ${userId} AND a.user_id = ${userId}
    `;

    if (moveCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 Move입니다' };
    }

    const validatedData = updateMoveSchema.parse(data);

    await sql`
      UPDATE moves SET
        executed_at = ${validatedData.executed_at}
      WHERE id = ${moveId} AND user_id = ${userId}
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update move:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Move 수정에 실패했습니다' };
  }
}

// NOTE: Move 기록을 삭제하는 서버 액션
export async function deleteMove(moveId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 Move가 현재 사용자의 것인지 확인
    const moveCheck = await sql`
      SELECT m.id FROM moves m
      JOIN activities a ON m.activity_id = a.id
      WHERE m.id = ${moveId} AND m.user_id = ${userId} AND a.user_id = ${userId}
    `;

    if (moveCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 Move입니다' };
    }

    await sql`
      DELETE FROM moves 
      WHERE id = ${moveId} AND user_id = ${userId}
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete move:', error);
    return { success: false, error: 'Move 삭제에 실패했습니다' };
  }
}

// NOTE: 활동을 삭제하는 서버 액션 (소프트 삭제)
export async function deleteActivity(activityId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다' };
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return { success: false, error: '권한이 없는 활동입니다' };
    }

    // 소프트 삭제 (is_active를 false로 설정)
    await sql`
      UPDATE activities SET
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${activityId} AND user_id = ${userId}
    `;

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete activity:', error);
    return { success: false, error: '활동 삭제에 실패했습니다' };
  }
}
