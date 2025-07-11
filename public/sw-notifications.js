// LastMove PWA - 푸시 알림 서비스 워커

// 서비스 워커 설치
self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker installing...");
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activating...");
  event.waitUntil(self.clients.claim());
});

// 푸시 알림 수신 처리
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event);

  if (!event.data) {
    console.log("[SW] No push data received");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[SW] Push data:", data);

    const options = {
      body: data.body || "새로운 알림이 있습니다",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/badge-72x72.png",
      tag: data.tag || "lastmove-notification",
      data: data.data || {},
      actions: [
        {
          action: "open",
          title: "열기",
          icon: "/icon-192x192.png",
        },
        {
          action: "close",
          title: "닫기",
        },
      ],
      requireInteraction:
        data.priority === "high" || data.priority === "urgent",
      silent: data.priority === "low",
      vibrate: data.priority === "urgent" ? [200, 100, 200] : [100],
      timestamp: Date.now(),
    };

    const title = data.title || "LastMove";

    event.waitUntil(
      self.registration
        .showNotification(title, options)
        .then(() => {
          console.log("[SW] Notification shown successfully");
          // 알림 표시 성공을 서버에 보고 (선택적)
          return fetch("/api/notifications/mark-delivered", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              notificationId: data.notificationId,
              delivered: true,
            }),
          }).catch((err) =>
            console.log("[SW] Failed to report delivery:", err)
          );
        })
        .catch((err) => {
          console.error("[SW] Failed to show notification:", err);
        })
    );
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);

    // 기본 알림 표시
    event.waitUntil(
      self.registration.showNotification("LastMove", {
        body: "새로운 알림이 있습니다",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
      })
    );
  }
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === "close") {
    console.log("[SW] Notification closed by user");
    return;
  }

  // 알림 클릭을 서버에 보고
  event.waitUntil(
    fetch("/api/notifications/mark-clicked", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
        action: action || "click",
      }),
    }).catch((err) => console.log("[SW] Failed to report click:", err))
  );

  // 앱 열기 또는 포커스
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }

      // 새 탭 열기
      if (self.clients.openWindow) {
        const targetUrl = data.activity
          ? `${self.location.origin}?activity=${data.activity.id}`
          : self.location.origin;
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event);

  const notification = event.notification;
  const data = notification.data || {};

  // 알림 닫기를 서버에 보고 (선택적)
  event.waitUntil(
    fetch("/api/notifications/mark-closed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
      }),
    }).catch((err) => console.log("[SW] Failed to report close:", err))
  );
});

// 백그라운드 동기화 (선택적)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "check-notifications") {
    event.waitUntil(
      fetch("/api/notifications/check-pending")
        .then((response) => response.json())
        .then((data) => {
          console.log("[SW] Checked pending notifications:", data);
        })
        .catch((err) => console.log("[SW] Failed to check notifications:", err))
    );
  }
});

// 메시지 처리 (클라이언트에서 서비스 워커로)
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "1.0.0" });
  }
});

// 오류 처리
self.addEventListener("error", (event) => {
  console.error("[SW] Service Worker error:", event);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event);
});

console.log("[SW] LastMove Service Worker loaded successfully");
