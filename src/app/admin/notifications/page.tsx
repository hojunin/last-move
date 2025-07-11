import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SmartNotificationManager from '@/components/SmartNotificationManager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// NOTE: 로딩 스켈레톤
function NotificationManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
              >
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function NotificationAdminPage() {
  // NOTE: 인증 확인 (나중에 관리자 권한 체크로 확장 가능)
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">알림 관리 대시보드</h1>
        <p className="text-gray-600 mt-2">
          스마트 알림 시스템의 상태를 모니터링하고 관리합니다.
        </p>
      </div>

      {/* 시스템 상태 카드 */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시스템 상태</CardTitle>
            <CardDescription>
              스마트 알림 시스템의 현재 상태를 표시합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">활성</div>
                <div className="text-sm text-gray-600">시스템 상태</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">매시간</div>
                <div className="text-sm text-gray-600">체크 주기</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  19, 21, 23시
                </div>
                <div className="text-sm text-gray-600">정기 알림 시간</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 스마트 알림 관리 컴포넌트 */}
      <Suspense fallback={<NotificationManagerSkeleton />}>
        <SmartNotificationManager />
      </Suspense>

      {/* 도움말 */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>도움말</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  정기 알림 체크
                </h4>
                <p className="text-gray-600">
                  매일 정해진 시간(19시, 21시, 23시)에 모든 활동을 분석하여 알림
                  필요 여부를 판단합니다. GitHub Actions을 통해 자동으로
                  실행되며, 수동으로도 실행할 수 있습니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  수동 알림 트리거
                </h4>
                <p className="text-gray-600">
                  정기 시간이 아니더라도 즉시 모든 활동을 분석하여 알림을
                  생성하고 발송합니다. 테스트나 긴급 상황에서 사용할 수
                  있습니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">알림 정책</h4>
                <p className="text-gray-600">
                  각 활동의 주기(일/주/월/분기/년)에 따라 다른 임계값을
                  적용합니다. 예를 들어, 일단위 활동은 당일 23시에, 주단위
                  활동은 주기의 80% 경과 시 알림을 발송합니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  GitHub Actions
                </h4>
                <p className="text-gray-600">
                  자동화된 알림 시스템은 GitHub Actions의 cron job을 통해
                  실행됩니다. 매시간마다 체크하되, 실제 알림 분석은 정기
                  시간에만 수행됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// NOTE: 페이지 메타데이터
export const metadata = {
  title: '알림 관리 - LastMove',
  description: '스마트 알림 시스템 관리 대시보드',
};
