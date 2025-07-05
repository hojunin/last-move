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

// NOTE: VAPID public key (should be loaded from environment variables)
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

  // Check notification permission status
  useEffect(() => {
    // Check browser support
    const hasNotification = "Notification" in window;
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;

    const supported = hasNotification && hasServiceWorker && hasPushManager;

    setIsSupported(supported);

    // Always log browser support details
    Sentry.addBreadcrumb({
      message: "Browser support check",
      category: "notification",
      level: "info",
      data: {
        hasNotification,
        hasServiceWorker,
        hasPushManager,
        supported,
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      },
    });

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // Check push subscription status
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

  // Request notification permission
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

        // Automatically set up subscription when permission is granted
        await subscribeToPush();
      } else {
        Sentry.captureMessage("Notification permission denied", "warning");
        setError("Notification permission was denied");
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
      setError(`Permission request failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up push subscription
  const subscribeToPush = async () => {
    Sentry.addBreadcrumb({
      message: "Starting push subscription",
      category: "notification",
      level: "info",
    });

    setError(null);

    try {
      // 1. Check browser support
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        const errorMsg = `Browser support insufficient: serviceWorker=${
          "serviceWorker" in navigator
        }, PushManager=${"PushManager" in window}`;
        throw new Error(errorMsg);
      }

      // 2. Check service worker registration
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
        throw new Error(`Service worker registration failed: ${errorMessage}`);
      }

      // 3. Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key is not configured");
      }

      // 4. Create push subscription
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
        throw new Error(`Subscription creation failed: ${errorMessage}`);
      }

      // 5. Save subscription info to server
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
          toast.success("Push notifications have been enabled!");
          setIsSubscribed(true);
        } else {
          throw new Error(result.error || "Failed to save subscription");
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
        throw new Error(`Server save error: ${errorMessage}`);
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

      // Provide more specific error messages to users
      let userMessage = "Failed to subscribe to push notifications";

      if (error instanceof Error) {
        if (error.message.includes("Browser support")) {
          userMessage = "This browser does not support push notifications";
        } else if (error.message.includes("Service worker")) {
          userMessage =
            "Service worker registration failed. Please check your network connection";
        } else if (error.message.includes("Subscription creation")) {
          userMessage =
            "Failed to create push subscription. Please check your browser settings";
        } else if (error.message.includes("Server")) {
          userMessage =
            "Failed to communicate with server. Please try again later";
        }
      }

      setError(userMessage);
      toast.error(userMessage);
    }
  };

  // Unsubscribe from push notifications
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
      setError("Failed to unsubscribe from push notifications");
    }
  };

  // Send test notification
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
            title: "Test Notification",
            body: "LastMove push notifications are working properly! 🎉",
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
        toast.success("Test notification sent!");
      } else {
        throw new Error(result.error || "Failed to send notification");
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
      toast.error(`Failed to send test notification: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Send local browser notification test
  const sendLocalNotification = () => {
    Sentry.addBreadcrumb({
      message: "Sending local browser notification",
      category: "notification",
      level: "info",
    });

    try {
      if (permission === "granted") {
        new Notification("Local Test Notification", {
          body: "This is a local browser notification test! 🎉",
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: "local-test",
        });
        toast.success("Local notification sent!");
      } else {
        toast.error("Notification permission not granted");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "NotificationPermission",
          action: "sendLocalNotification",
        },
      });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to send local notification: ${errorMessage}`);
    }
  };

  // Check notification support
  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            This browser does not support push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debugging information */}
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              🔍 Debug Information (for troubleshooting)
            </summary>
            <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
              <div>
                Browser: {navigator.userAgent.split(" ").slice(-2).join(" ")}
              </div>
              <div>
                HTTPS: {window.location.protocol === "https:" ? "✅" : "❌"}
              </div>
              <div>
                Service Worker Support:{" "}
                {"serviceWorker" in navigator ? "✅" : "❌"}
              </div>
              <div>
                Push Manager Support: {"PushManager" in window ? "✅" : "❌"}
              </div>
              <div>
                Notification Support: {"Notification" in window ? "✅" : "❌"}
              </div>
              <div>Current URL: {window.location.href}</div>
            </div>
          </details>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Get activity reminders and celebration messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission status display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notification Permission</span>
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
              ? "Granted"
              : permission === "denied"
              ? "Denied"
              : "Not Set"}
          </Badge>
        </div>

        {/* Subscription status display */}
        {permission === "granted" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Push Notifications</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Subscribed" : "Not Subscribed"}
            </Badge>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {permission === "default" && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Requesting..." : "Allow Notifications"}
            </Button>
          )}

          {permission === "granted" && !isSubscribed && (
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Subscribing..." : "Subscribe to Push Notifications"}
            </Button>
          )}

          {permission === "granted" && isSubscribed && (
            <div className="space-y-2">
              <Button
                onClick={sendLocalNotification}
                variant="outline"
                className="w-full"
              >
                Local Test Notification
              </Button>
              <Button
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Server Push Notification"}
              </Button>
              <Button
                onClick={unsubscribeFromPush}
                variant="outline"
                className="w-full"
              >
                Unsubscribe
              </Button>
            </div>
          )}

          {permission === "denied" && (
            <div className="text-sm text-gray-600 text-center">
              Please allow notifications in your browser settings
              <br />
              and refresh the page.
            </div>
          )}
        </div>

        {/* iOS PWA guide */}
        {navigator.userAgent.includes("iPhone") && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 To receive notifications on iOS, please add this app to your home
            screen.
          </div>
        )}

        {/* Debugging information */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            🔍 Debug Information (for troubleshooting)
          </summary>
          <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
            <div>
              Browser: {navigator.userAgent.split(" ").slice(-2).join(" ")}
            </div>
            <div>
              HTTPS: {window.location.protocol === "https:" ? "✅" : "❌"}
            </div>
            <div>
              Service Worker Support:{" "}
              {"serviceWorker" in navigator ? "✅" : "❌"}
            </div>
            <div>
              Push Manager Support: {"PushManager" in window ? "✅" : "❌"}
            </div>
            <div>
              Notification Support: {"Notification" in window ? "✅" : "❌"}
            </div>
            <div>Current Permission: {permission}</div>
            <div>
              Subscription Status:{" "}
              {isSubscribed ? "Subscribed" : "Not Subscribed"}
            </div>
            <div>VAPID Key Length: {VAPID_PUBLIC_KEY.length}</div>
            <div>Current URL: {window.location.href}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
