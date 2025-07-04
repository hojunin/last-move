import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 개발 환경에서는 모든 에러를 캡처하고, 프로덕션에서는 샘플링
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 모든 이벤트 전송
    if (process.env.NODE_ENV === "development") {
      return event;
    }

    // 프로덕션에서는 특정 에러만 필터링
    const error = hint.originalException;

    // 네트워크 에러는 항상 전송
    if (error instanceof Error && error.message.includes("fetch")) {
      return event;
    }

    // 푸시 알림 관련 에러는 항상 전송
    if (
      error instanceof Error &&
      (error.message.includes("push") ||
        error.message.includes("notification") ||
        error.message.includes("subscription"))
    ) {
      return event;
    }

    return event;
  },
});
