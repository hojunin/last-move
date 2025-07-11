import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 서버에서는 낮은 샘플링 비율 사용
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 서버 사이드 에러 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 모든 이벤트 전송
    if (process.env.NODE_ENV === "development") {
      return event;
    }

    const error = hint.originalException;

    // 데이터베이스 에러는 항상 전송
    if (
      error instanceof Error &&
      (error.message.includes("sql") ||
        error.message.includes("database") ||
        error.message.includes("connection"))
    ) {
      return event;
    }

    // 인증 관련 에러는 항상 전송
    if (
      error instanceof Error &&
      (error.message.includes("auth") ||
        error.message.includes("session") ||
        error.message.includes("token"))
    ) {
      return event;
    }

    // 푸시 알림 관련 에러는 항상 전송
    if (
      error instanceof Error &&
      (error.message.includes("push") ||
        error.message.includes("notification") ||
        error.message.includes("vapid") ||
        error.message.includes("subscription"))
    ) {
      return event;
    }

    return event;
  },
});
