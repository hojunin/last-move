"use server";

import { sql } from "./db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";

// NOTE: 활동 정의 타입
export interface Activity {
  id: number;
  title: string;
  category: string | null;
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
  category: z.string().optional(),
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
      category: formData.get("category") || null,
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

    const result = await sql`
      INSERT INTO activities (
        title, 
        category, 
        description,
        reminder_rule_type, 
        reminder_interval, 
        reminder_days_of_week,
        user_id
      )
      VALUES (
        ${validatedData.title},
        ${validatedData.category},
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
    const activityResult = await createActivity(formData);
    if (!activityResult.success) {
      return activityResult;
    }

    const moveResult = await createMove(activityResult.activityId!);
    if (!moveResult.success) {
      return moveResult;
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create activity and move:", error);
    return { success: false, error: "활동 및 Move 생성에 실패했습니다" };
  }
}

// NOTE: 기존 호환성을 위한 별칭 (기존 컴포넌트에서 사용)
export const getItems = getActivitiesWithLastMove;
export const logAction = async (activityId: number) =>
  await createMove(activityId);
export type LastMoveItem = ActivityWithLastMove;
