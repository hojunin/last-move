"use server";

import { sql } from "./db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";

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

// NOTE: 활동 정의 타입
export interface Activity {
  id: number;
  title: string;
  category: string | null;
  category_id: number | null;
  description: string | null;
  reminder_rule_type: "none" | "daily" | "weekly" | "monthly" | "custom" | null;
  reminder_interval: number | null;
  reminder_days_of_week: number[] | null;
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
  description: string | null;
  last_executed_at: string | null;
  move_count: number;
  last_move_date: string | null; // 가장 최근 move의 날짜 (오늘 완료 체크용)
}

// NOTE: 활동 생성을 위한 Zod 스키마
const createActivitySchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  category_id: z.number().optional(),
  description: z.string().optional(),
  reminder_rule_type: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .optional(),
  reminder_interval: z.number().optional(),
  reminder_days_of_week: z.array(z.number()).optional(),
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
    console.error("Failed to fetch categories:", error);
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
      console.log("No authenticated user found");
      return [];
    }

    const userId = parseInt(session.user.id);
    const result = await sql`
      SELECT 
        a.id,
        a.title,
        a.category,
        a.description,
        MAX(m.executed_at) as last_executed_at,
        COUNT(m.id) as move_count,
        MAX(DATE(m.executed_at)) as last_move_date
      FROM activities a
      LEFT JOIN moves m ON a.id = m.activity_id
      WHERE a.is_active = true AND a.user_id = ${userId}
      GROUP BY a.id, a.title, a.category, a.description
      ORDER BY last_executed_at ASC NULLS LAST
    `;

    return result.rows as ActivityWithLastMove[];
  } catch (error) {
    console.error("Failed to fetch activities:", error);
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
      AND (title ILIKE ${"%" + query + "%"} OR category ILIKE ${
      "%" + query + "%"
    })
      ORDER BY title
      LIMIT 10
    `;

    return result.rows as Activity[];
  } catch (error) {
    console.error("Failed to search activities:", error);
    return [];
  }
}

// NOTE: 새 활동을 생성하는 서버 액션 (사용자별)
export async function createActivity(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const userId = parseInt(session.user.id);
    const rawData = {
      title: formData.get("title"),
      category_id: formData.get("category_id")
        ? Number(formData.get("category_id"))
        : null,
      description: formData.get("description") || null,
      reminder_rule_type: formData.get("reminder_rule_type") || "none",
      reminder_interval: formData.get("reminder_interval")
        ? Number(formData.get("reminder_interval"))
        : null,
      reminder_days_of_week: formData.get("reminder_days_of_week")
        ? JSON.parse(formData.get("reminder_days_of_week") as string)
        : null,
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
      return { success: false, error: "이미 존재하는 활동입니다" };
    }

    const result = await sql`
      INSERT INTO activities (
        title, 
        category_id,
        description,
        reminder_rule_type, 
        reminder_interval, 
        reminder_days_of_week,
        user_id
      )
      VALUES (
        ${validatedData.title},
        ${validatedData.category_id},
        ${validatedData.description},
        ${validatedData.reminder_rule_type || "none"},
        ${validatedData.reminder_interval},
        ${
          validatedData.reminder_days_of_week
            ? JSON.stringify(validatedData.reminder_days_of_week)
            : null
        },
        ${userId}
      )
      RETURNING id
    `;

    revalidatePath("/");
    return { success: true, activityId: result.rows[0].id };
  } catch (error) {
    console.error("Failed to create activity:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "활동 생성에 실패했습니다" };
  }
}

// NOTE: 새 Move를 기록하는 서버 액션 (사용자별)
export async function createMove(activityId: number, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const userId = parseInt(session.user.id);

    // 해당 활동이 현재 사용자의 것인지 확인
    const activityCheck = await sql`
      SELECT id FROM activities WHERE id = ${activityId} AND user_id = ${userId}
    `;

    if (activityCheck.rows.length === 0) {
      return { success: false, error: "권한이 없는 활동입니다" };
    }

    await sql`
      INSERT INTO moves (activity_id, notes, user_id)
      VALUES (${activityId}, ${notes || null}, ${userId})
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create move:", error);
    return { success: false, error: "Move 기록에 실패했습니다" };
  }
}

// NOTE: 활동과 Move를 함께 생성하는 서버 액션
export async function createActivityAndMove(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("인증이 필요합니다");
    }

    const userId = parseInt(session.user.id);
    const title = formData.get("title") as string;
    const categoryId = formData.get("category_id") as string;

    if (!title || !categoryId) {
      throw new Error("모든 필드를 입력해주세요");
    }

    // 중복 활동 체크
    const existingActivity = await sql`
      SELECT id FROM activities 
      WHERE title = ${title} 
      AND user_id = ${userId} 
      AND is_active = true
    `;

    if (existingActivity.rows.length > 0) {
      throw new Error("이미 존재하는 활동입니다");
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

    revalidatePath("/");
  } catch (error) {
    console.error("Failed to create activity and move:", error);
    throw error;
  }
}

// NOTE: 기존 호환성을 위한 별칭 (기존 컴포넌트에서 사용)
export const getItems = getActivitiesWithLastMove;
export const logAction = async (activityId: number) =>
  await createMove(activityId);
export type LastMoveItem = ActivityWithLastMove;
