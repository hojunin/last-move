import { Clock, Calendar as CalendarIcon, Repeat } from 'lucide-react';
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

const formatFrequency = (frequency: {
  type: 'preset' | 'custom';
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'quarters' | 'years';
}) => {
  const unitLabels: Record<string, string> = {
    days: '일',
    weeks: '주',
    months: '개월',
    quarters: '분기',
    years: '년',
  };

  const presetLabels: Record<string, string> = {
    '1-days': '하루',
    '1-weeks': '일주일',
    '1-months': '한달',
    '1-quarters': '한분기',
    '6-months': '한반기',
    '1-years': '일년',
  };

  const key = `${frequency.value}-${frequency.unit}`;
  const presetLabel = presetLabels[key];

  if (frequency.type === 'preset' && presetLabel) {
    return presetLabel;
  }

  return `${frequency.value}${unitLabels[frequency.unit]}`;
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
      <div className="flex items-center gap-2 text-sm">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium w-20">활동 주기</span>
        <span className="text-muted-foreground">
          {formatFrequency({
            type: activity.frequency_type,
            value: activity.frequency_value,
            unit: activity.frequency_unit,
          })}
        </span>
      </div>
    </div>
  );
}
