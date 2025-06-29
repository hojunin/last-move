import { NextRequest, NextResponse } from "next/server";
import {
  sendPendingNotifications,
  sendImmediateNotification,
} from "@/lib/push-service";

// NOTE: 대기 중인 알림 발송
export async function POST(request: NextRequest) {
  try {
    const { type, userId, notification } = await request.json();

    if (type === "pending") {
      // 대기 중인 모든 알림 발송
      const result = await sendPendingNotifications();
      return NextResponse.json(result);
    } else if (type === "immediate" && userId && notification) {
      // 즉시 알림 발송
      const result = await sendImmediateNotification(userId, notification);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: "잘못된 요청 형식입니다" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to send notifications:", error);
    return NextResponse.json(
      { success: false, error: "알림 발송에 실패했습니다" },
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
    console.error("Failed to get notification service status:", error);
    return NextResponse.json(
      { success: false, error: "상태 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
