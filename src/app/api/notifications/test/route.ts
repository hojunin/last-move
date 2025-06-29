import { NextRequest, NextResponse } from "next/server";
import {
  createDailyReminders,
  createLongInactiveReminders,
  createStreakCelebrationNotifications,
} from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();

    let result;

    switch (type) {
      case "daily":
        result = await createDailyReminders();
        break;
      case "inactive":
        result = await createLongInactiveReminders();
        break;
      case "streak":
        result = await createStreakCelebrationNotifications();
        break;
      default:
        return NextResponse.json(
          { success: false, error: "지원하지 않는 알림 타입입니다" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create test notification:", error);
    return NextResponse.json(
      { success: false, error: "알림 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
