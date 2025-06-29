"use server";

import { sql } from "./db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// NOTE: 데이터베이스 스키마와 일치하는 타입 정의
export interface LastMoveItem {
  id: number;
  title: string;
  category: string | null;
  last_action_at: string;
  action_count: number;
  created_at: string;
  updated_at: string;
  reminder_rule_type: "none" | "daily" | "weekly" | "monthly" | "custom" | null;
  reminder_interval: number | null;
  reminder_days_of_week: number[] | null;
}

// NOTE: 폼 데이터 검증을 위한 Zod 스키마
const createItemSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  category: z.string().optional(),
  last_action_at: z.string().optional(),
  reminder_rule_type: z
    .enum(["none", "daily", "weekly", "monthly", "custom"])
    .optional(),
  reminder_interval: z.number().optional(),
  reminder_days_of_week: z.array(z.number()).optional(),
});

// NOTE: 모든 아이템을 가져오는 서버 액션
export async function getItems(): Promise<LastMoveItem[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        title,
        category,
        last_action_at,
        action_count,
        created_at,
        updated_at,
        reminder_rule_type,
        reminder_interval,
        reminder_days_of_week
      FROM last_move_items 
      ORDER BY last_action_at ASC
    `;

    return result.rows as LastMoveItem[];
  } catch (error) {
    console.error("Failed to fetch items:", error);
    // NOTE: 데이터베이스 연결 실패 시 빈 배열 반환 (개발 환경에서 빌드 가능하도록)
    return [];
  }
}

// NOTE: 새 아이템을 생성하는 서버 액션
export async function createItem(formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title"),
      category: formData.get("category") || null,
      last_action_at:
        formData.get("last_action_at") || new Date().toISOString(),
      reminder_rule_type: formData.get("reminder_rule_type") || "none",
      reminder_interval: formData.get("reminder_interval")
        ? Number(formData.get("reminder_interval"))
        : null,
      reminder_days_of_week: formData.get("reminder_days_of_week")
        ? JSON.parse(formData.get("reminder_days_of_week") as string)
        : null,
    };

    const validatedData = createItemSchema.parse(rawData);

    await sql`
      INSERT INTO last_move_items (
        title, 
        category, 
        last_action_at, 
        reminder_rule_type, 
        reminder_interval, 
        reminder_days_of_week
      )
      VALUES (
        ${validatedData.title},
        ${validatedData.category},
        ${validatedData.last_action_at || new Date().toISOString()},
        ${validatedData.reminder_rule_type || "none"},
        ${validatedData.reminder_interval},
        ${
          validatedData.reminder_days_of_week
            ? JSON.stringify(validatedData.reminder_days_of_week)
            : null
        }
      )
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create item:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "아이템 생성에 실패했습니다" };
  }
}

// NOTE: 아이템의 액션을 로그하는 서버 액션
export async function logAction(id: number) {
  try {
    await sql`
      UPDATE last_move_items 
      SET 
        last_action_at = NOW(),
        action_count = action_count + 1
      WHERE id = ${id}
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to log action:", error);
    return { success: false, error: "액션 로그에 실패했습니다" };
  }
}
