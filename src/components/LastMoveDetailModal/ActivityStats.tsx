import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { daysSince } from '@/lib/utils';
import { ActivityStatsProps } from './types';

const formatLastExecuted = (lastExecutedAt: string | null) => {
  if (!lastExecutedAt) return '기록 없음';

  const days = daysSince(lastExecutedAt);
  const formattedDate = dayjs(lastExecutedAt).format('YYYY-MM-DD');

  if (days === 0) return `오늘 (${formattedDate})`;
  if (days === 1) return `1일 전 (${formattedDate})`;
  return `${days}일 전 (${formattedDate})`;
};

export default function ActivityStats({ activity }: ActivityStatsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium w-20">마지막 실행</span>
        <span className="text-muted-foreground">
          {formatLastExecuted(activity.last_executed_at)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium w-20">총 횟수</span>
        <span className="text-muted-foreground">{activity.move_count}회</span>
      </div>
    </div>
  );
}
