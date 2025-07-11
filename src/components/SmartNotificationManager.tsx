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
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Clock,
  TrendingUp,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// NOTE: 알림 통계 인터페이스
interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  clickedNotifications: number;
  pendingNotifications: number;
  recentNotifications: Array<{
    id: number;
    title: string;
    body: string;
    type: string;
    priority: string;
    created_at: string;
    sent_at: string | null;
    clicked_at: string | null;
  }>;
}

// NOTE: 알림 체크 결과 인터페이스
interface NotificationCheckResult {
  success: boolean;
  message: string;
  currentTime: string;
  isRegularTime: boolean;
  nextRegularTime: string | null;
  analyzedActivities?: number;
  notificationTargets?: number;
}

export default function SmartNotificationManager() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [lastCheckResult, setLastCheckResult] =
    useState<NotificationCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggeringManual, setIsTriggeringManual] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // NOTE: 컴포넌트 마운트 시 통계 로드
  useEffect(() => {
    loadStats();
  }, []);

  // NOTE: 알림 통계 로드
  const loadStats = async () => {
    setIsRefreshingStats(true);
    try {
      const response = await fetch('/api/notifications/smart-check');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('알림 통계 로드 실패: ' + data.error);
      }
    } catch (error) {
      toast.error('알림 통계 로드 중 오류 발생');
      console.error('Failed to load notification stats:', error);
    } finally {
      setIsRefreshingStats(false);
    }
  };

  // NOTE: 정기 알림 체크
  const checkNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/smart-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastCheckResult(data.checkResult);
        toast.success('알림 체크 완료: ' + data.message);

        // 통계 새로고침
        await loadStats();
      } else {
        toast.error('알림 체크 실패: ' + data.error);
      }
    } catch (error) {
      toast.error('알림 체크 중 오류 발생');
      console.error('Failed to check notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: 수동 알림 트리거
  const triggerManualNotification = async () => {
    setIsTriggeringManual(true);
    try {
      const response = await fetch('/api/notifications/smart-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trigger',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('수동 알림 트리거 완료: ' + data.message);

        // 통계 새로고침
        await loadStats();
      } else {
        toast.error('수동 알림 트리거 실패: ' + data.error);
      }
    } catch (error) {
      toast.error('수동 알림 트리거 중 오류 발생');
      console.error('Failed to trigger manual notification:', error);
    } finally {
      setIsTriggeringManual(false);
    }
  };

  // NOTE: 우선순위 색상 반환
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  // NOTE: 알림 타입 텍스트 반환
  const getNotificationTypeText = (type: string) => {
    const typeMap = {
      daily_reminder: '일일 알림',
      weekly_reminder: '주간 알림',
      long_inactive: '장기 미실행',
      streak_celebration: '연속 기록',
      goal_achievement: '목표 달성',
      encouragement: '격려',
      custom: '사용자 정의',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">스마트 알림 관리</h2>
          <p className="text-gray-600">
            활동 주기 기반 맞춤형 알림 시스템을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadStats}
            disabled={isRefreshingStats}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                isRefreshingStats ? 'animate-spin' : ''
              }`}
            />
            새로고침
          </Button>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button
          onClick={checkNotifications}
          disabled={isLoading}
          className="flex-1"
        >
          <Clock className="w-4 h-4 mr-2" />
          {isLoading ? '체크 중...' : '정기 알림 체크'}
        </Button>
        <Button
          onClick={triggerManualNotification}
          disabled={isTriggeringManual}
          variant="outline"
          className="flex-1"
        >
          <Play className="w-4 h-4 mr-2" />
          {isTriggeringManual ? '실행 중...' : '수동 알림 트리거'}
        </Button>
      </div>

      {/* 마지막 체크 결과 */}
      {lastCheckResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastCheckResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              마지막 체크 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">현재 시간:</span>
                <span className="text-sm font-medium">
                  {lastCheckResult.currentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">정기 알림 시간:</span>
                <Badge
                  variant={
                    lastCheckResult.isRegularTime ? 'default' : 'secondary'
                  }
                >
                  {lastCheckResult.isRegularTime ? '예' : '아니오'}
                </Badge>
              </div>
              {lastCheckResult.nextRegularTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">다음 정기 시간:</span>
                  <span className="text-sm font-medium">
                    {lastCheckResult.nextRegularTime}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">메시지:</span>
                <span className="text-sm font-medium">
                  {lastCheckResult.message}
                </span>
              </div>
              {lastCheckResult.analyzedActivities !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">분석된 활동:</span>
                  <span className="text-sm font-medium">
                    {lastCheckResult.analyzedActivities}개
                  </span>
                </div>
              )}
              {lastCheckResult.notificationTargets !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">알림 대상:</span>
                  <span className="text-sm font-medium">
                    {lastCheckResult.notificationTargets}개
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 알림 통계 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold">
                  {stats.totalNotifications}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                발송된 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {stats.sentNotifications}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                클릭된 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-2xl font-bold">
                  {stats.clickedNotifications}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                대기 중 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold">
                  {stats.pendingNotifications}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 최근 알림 목록 */}
      {stats?.recentNotifications && stats.recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
            <CardDescription>최근 10개의 알림을 표시합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(
                      notification.priority,
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getNotificationTypeText(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        생성:{' '}
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {notification.sent_at && (
                        <span>
                          발송:{' '}
                          {new Date(notification.sent_at).toLocaleString()}
                        </span>
                      )}
                      {notification.clicked_at && (
                        <span>
                          클릭:{' '}
                          {new Date(notification.clicked_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 알림 정책 설명 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 정책</CardTitle>
          <CardDescription>주기별 알림 발송 규칙입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">정기 알림 시간</h4>
              <div className="flex gap-2">
                <Badge variant="outline">오후 7시</Badge>
                <Badge variant="outline">오후 9시</Badge>
                <Badge variant="outline">오후 11시</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">주기별 임계값</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">일단위 활동</p>
                  <p className="text-gray-600">
                    당일 오후 11시에 미완료 시 알림
                  </p>
                </div>
                <div>
                  <p className="font-medium">주단위 활동</p>
                  <p className="text-gray-600">주기의 80%, 95% 경과 시 알림</p>
                </div>
                <div>
                  <p className="font-medium">월단위 활동</p>
                  <p className="text-gray-600">주기의 85%, 95% 경과 시 알림</p>
                </div>
                <div>
                  <p className="font-medium">분기/년단위 활동</p>
                  <p className="text-gray-600">
                    주기의 80%, 90%, 95% 경과 시 알림
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
