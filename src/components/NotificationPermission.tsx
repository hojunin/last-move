"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";
import { savePushSubscription } from "@/lib/notifications";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

// NOTE: VAPID 공개 키 (환경 변수에서 가져와야 함)
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWw6MXB5xYKkxUcCjNUfkWgXX7iYAKQNFcJIHuTKXLxZJVF8vVNxKY";

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export default function NotificationPermission({
  onPermissionChange,
}: NotificationPermissionProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // 알림 권한 상태 확인
  useEffect(() => {
    // 브라우저 지원 여부 확인
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    } else {
      Sentry.addBreadcrumb({
        message: "Push notifications not supported",
        category: "notification",
        level: "info",
        data: {
          hasNotification: "Notification" in window,
          hasServiceWorker: "serviceWorker" in navigator,
          hasPushManager: "PushManager" in window,
          userAgent: navigator.userAgent,
        },
      });
    }
  }, []);

  // 푸시 구독 상태 확인
  const checkSubscription = async () => {
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  };

  // 알림 권한 요청
  const requestPermission = async () => {
    Sentry.addBreadcrumb({
      message: "Requesting notification permission",
      category: "notification",
      level: "info",
    });

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      onPermissionChange?.(permission);

      if (permission === "granted") {
        Sentry.addBreadcrumb({
          message: "Notification permission granted",
          category: "notification",
          level: "info",
        });

        // 권한이 허용되면 자동으로 구독 설정
        await subscribeToPush();
      } else {
        Sentry.captureMessage("Notification permission denied", "warning");
        setError("알림 권한이 거부되었습니다");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Sentry.captureException(error, {
        tags: {
          component: "NotificationPermission",
          action: "requestPermission",
        },
        extra: {
          userAgent: navigator.userAgent,
          currentPermission: permission,
        },
      });
      setError(`권한 요청 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 푸시 구독 설정
  const subscribeToPush = async () => {
    Sentry.addBreadcrumb({
      message: "Starting push subscription",
      category: "notification",
      level: "info",
    });

    setError(null);

    try {
      // 1. 브라우저 지원 여부 확인
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        const errorMsg = `브라우저 지원 부족: serviceWorker=${
          "serviceWorker" in navigator
        }, PushManager=${"PushManager" in window}`;
        throw new Error(errorMsg);
      }

      // 2. 서비스 워커 등록 확인
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
        Sentry.addBreadcrumb({
          message: "Service worker ready",
          category: "notification",
          level: "info",
          data: {
            scope: registration.scope,
            active: !!registration.active,
          },
        });
      } catch (swError) {
        Sentry.captureException(swError, {
          tags: {
            component: "NotificationPermission",
            action: "serviceWorkerReady",
          },
        });
        const errorMessage =
          swError instanceof Error ? swError.message : String(swError);
        throw new Error(`서비스 워커 등록 실패: ${errorMessage}`);
      }

      // 3. VAPID 공개 키 가져오기
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID 공개 키가 설정되지 않았습니다");
      }

      // 4. 푸시 구독 생성
      let subscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        Sentry.addBreadcrumb({
          message: "Push subscription created",
          category: "notification",
          level: "info",
          data: {
            endpoint: subscription.endpoint,
            hasKeys: !!subscription.getKey,
          },
        });
      } catch (subscribeError) {
        Sentry.captureException(subscribeError, {
          tags: {
            component: "NotificationPermission",
            action: "createSubscription",
          },
          extra: {
            vapidKeyLength: vapidPublicKey.length,
            registrationScope: registration.scope,
          },
        });
        const errorMessage =
          subscribeError instanceof Error
            ? subscribeError.message
            : String(subscribeError);
        throw new Error(`구독 생성 실패: ${errorMessage}`);
      }

      // 5. 서버에 구독 정보 저장
      try {
        const subscriptionObject = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey("p256dh")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("p256dh")!)
                  )
                )
              : "",
            auth: subscription.getKey("auth")
              ? btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("auth")!)
                  )
                )
              : "",
          },
        };

        const result = await savePushSubscription(subscriptionObject);

        if (result.success) {
          Sentry.addBreadcrumb({
            message: "Push subscription saved successfully",
            category: "notification",
            level: "info",
          });
          toast.success("푸시 알림이 활성화되었습니다!");
          setIsSubscribed(true);
        } else {
          throw new Error(result.error || "구독 저장 실패");
        }
      } catch (saveError) {
        Sentry.captureException(saveError, {
          tags: {
            component: "NotificationPermission",
            action: "saveSubscription",
          },
        });
        const errorMessage =
          saveError instanceof Error ? saveError.message : String(saveError);
        throw new Error(`서버 저장 오류: ${errorMessage}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "NotificationPermission",
          action: "subscribeToPush",
        },
        extra: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          isHttps: window.location.protocol === "https:",
          notificationPermission: Notification.permission,
        },
      });

      // 사용자에게 더 구체적인 에러 메시지 제공
      let userMessage = "푸시 알림 구독에 실패했습니다";

      if (error instanceof Error) {
        if (error.message.includes("브라우저 지원")) {
          userMessage = "이 브라우저는 푸시 알림을 지원하지 않습니다";
        } else if (error.message.includes("서비스 워커")) {
          userMessage =
            "서비스 워커 등록에 실패했습니다. 네트워크를 확인해주세요";
        } else if (error.message.includes("구독 생성")) {
          userMessage =
            "푸시 구독 생성에 실패했습니다. 브라우저 설정을 확인해주세요";
        } else if (error.message.includes("서버")) {
          userMessage =
            "서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요";
        }
      }

      setError(userMessage);
      toast.error(userMessage);
    }
  };

  // 푸시 구독 해제
  const unsubscribeFromPush = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          Sentry.addBreadcrumb({
            message: "Push subscription removed",
            category: "notification",
            level: "info",
          });
        }
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "NotificationPermission",
          action: "unsubscribeFromPush",
        },
      });
      setError("푸시 알림 구독 해제에 실패했습니다");
    }
  };

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    Sentry.addBreadcrumb({
      message: "Sending test notification",
      category: "notification",
      level: "info",
    });

    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "immediate",
          notification: {
            title: "테스트 알림",
            body: "LastMove 푸시 알림이 정상적으로 작동합니다! 🎉",
            icon: "/icon-192x192.png",
            priority: "normal",
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        Sentry.addBreadcrumb({
          message: "Test notification sent successfully",
          category: "notification",
          level: "info",
        });
        toast.success("테스트 알림을 발송했습니다!");
      } else {
        throw new Error(result.error || "알림 발송 실패");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "NotificationPermission",
          action: "sendTestNotification",
        },
      });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`테스트 알림 발송 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 지원 여부 확인
  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            알림 미지원
          </CardTitle>
          <CardDescription>
            이 브라우저는 푸시 알림을 지원하지 않습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          알림 설정
        </CardTitle>
        <CardDescription>
          활동 리마인더와 축하 메시지를 받아보세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 권한 상태 표시 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">알림 권한</span>
          <Badge
            variant={
              permission === "granted"
                ? "default"
                : permission === "denied"
                ? "destructive"
                : "secondary"
            }
          >
            {permission === "granted"
              ? "허용됨"
              : permission === "denied"
              ? "거부됨"
              : "미설정"}
          </Badge>
        </div>

        {/* 구독 상태 표시 */}
        {permission === "granted" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">푸시 알림</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "구독됨" : "미구독"}
            </Badge>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-2">
          {permission === "default" && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "요청 중..." : "알림 허용하기"}
            </Button>
          )}

          {permission === "granted" && !isSubscribed && (
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "구독 중..." : "푸시 알림 구독"}
            </Button>
          )}

          {permission === "granted" && isSubscribed && (
            <div className="space-y-2">
              <Button
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
              >
                로컬 테스트 알림
              </Button>
              <Button
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "발송 중..." : "푸시 알림 테스트"}
              </Button>
              <Button
                onClick={unsubscribeFromPush}
                variant="outline"
                className="w-full"
              >
                구독 해제
              </Button>
            </div>
          )}

          {permission === "denied" && (
            <div className="text-sm text-gray-600 text-center">
              브라우저 설정에서 알림을 허용한 후<br />
              페이지를 새로고침해주세요.
            </div>
          )}
        </div>

        {/* iOS PWA 안내 */}
        {navigator.userAgent.includes("iPhone") && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 iOS에서 알림을 받으려면 홈 화면에 앱을 추가해주세요.
          </div>
        )}

        {/* 디버깅 정보 */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            🔍 디버깅 정보 (문제 해결용)
          </summary>
          <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
            <div>
              브라우저: {navigator.userAgent.split(" ").slice(-2).join(" ")}
            </div>
            <div>
              HTTPS: {window.location.protocol === "https:" ? "✅" : "❌"}
            </div>
            <div>
              Service Worker 지원: {"serviceWorker" in navigator ? "✅" : "❌"}
            </div>
            <div>
              Push Manager 지원: {"PushManager" in window ? "✅" : "❌"}
            </div>
            <div>
              Notification 지원: {"Notification" in window ? "✅" : "❌"}
            </div>
            <div>현재 권한: {permission}</div>
            <div>구독 상태: {isSubscribed ? "구독됨" : "미구독"}</div>
            <div>VAPID 키 길이: {VAPID_PUBLIC_KEY.length}</div>
            <div>현재 URL: {window.location.href}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
