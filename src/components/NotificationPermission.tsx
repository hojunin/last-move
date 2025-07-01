'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
import { savePushSubscription } from '@/lib/notifications';

// NOTE: VAPID 공개 키 (환경 변수에서 가져와야 함)
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWw6MXB5xYKkxUcCjNUfkWgXX7iYAKQNFcJIHuTKXLxZJVF8vVNxKY';

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export default function NotificationPermission({
  onPermissionChange,
}: NotificationPermissionProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 알림 권한 상태 확인
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // 푸시 구독 상태 확인
  const checkSubscription = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  // 알림 권한 요청
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('이 브라우저는 알림을 지원하지 않습니다');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      onPermissionChange?.(permission);

      if (permission === 'granted') {
        await subscribeToPush();
      } else if (permission === 'denied') {
        setError(
          '알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.',
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      setError('알림 권한 요청에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 푸시 구독 설정
  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push messaging is not supported');
      }

      // 서비스 워커 등록 확인
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register(
          '/sw-notifications.js',
        );
        await navigator.serviceWorker.ready;
      }

      // 기존 구독 확인
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 새 구독 생성
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });
      }

      // 서버에 구독 정보 저장
      const result = await savePushSubscription(
        subscription.toJSON() as Record<string, unknown>,
      );

      if (result.success) {
        setIsSubscribed(true);
        console.log('Push subscription saved successfully');
      } else {
        throw new Error(result.error || 'Failed to save subscription');
      }
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      setError('푸시 알림 구독에 실패했습니다');
    }
  };

  // 푸시 구독 해제
  const unsubscribeFromPush = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          console.log('Push subscription removed');
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      setError('푸시 알림 구독 해제에 실패했습니다');
    }
  };

  // Base64 URL을 Uint8Array로 변환
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // 테스트 알림 보내기 (로컬)
  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('LastMove 테스트 알림', {
        body: '알림이 정상적으로 작동합니다! 🎉',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
      });
    }
  };

  // 푸시 알림 테스트 (서버를 통해)
  const sendPushTest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'immediate',
          notification: {
            title: '🚀 LastMove 푸시 알림 테스트',
            body: '서버를 통한 푸시 알림이 정상적으로 작동합니다!',
            priority: 'normal',
            data: { test: true },
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('푸시 알림 테스트 성공');
      } else {
        setError(result.error || '푸시 알림 테스트에 실패했습니다');
      }
    } catch (error) {
      console.error('푸시 알림 테스트 오류:', error);
      setError('푸시 알림 테스트 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 지원 여부 확인
  if (!('Notification' in window)) {
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
              permission === 'granted'
                ? 'default'
                : permission === 'denied'
                ? 'destructive'
                : 'secondary'
            }
          >
            {permission === 'granted'
              ? '허용됨'
              : permission === 'denied'
              ? '거부됨'
              : '미설정'}
          </Badge>
        </div>

        {/* 구독 상태 표시 */}
        {permission === 'granted' && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">푸시 알림</span>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? '구독됨' : '미구독'}
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
          {permission === 'default' && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '요청 중...' : '알림 허용하기'}
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '구독 중...' : '푸시 알림 구독'}
            </Button>
          )}

          {permission === 'granted' && isSubscribed && (
            <div className="space-y-2">
              <Button
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
              >
                로컬 테스트 알림
              </Button>
              <Button
                onClick={sendPushTest}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '발송 중...' : '푸시 알림 테스트'}
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

          {permission === 'denied' && (
            <div className="text-sm text-gray-600 text-center">
              브라우저 설정에서 알림을 허용한 후<br />
              페이지를 새로고침해주세요.
            </div>
          )}
        </div>

        {/* iOS PWA 안내 */}
        {navigator.userAgent.includes('iPhone') && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 iOS에서 알림을 받으려면 홈 화면에 앱을 추가해주세요.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
