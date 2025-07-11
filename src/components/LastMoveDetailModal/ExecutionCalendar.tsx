import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import { ExecutionCalendarProps } from './types';

export default function ExecutionCalendar({
  moves,
  onDateClick,
}: ExecutionCalendarProps) {
  const moveDates = moves.map((move) => new Date(move.executed_at));

  return (
    <div className="space-y-4">
      <h4 className="font-medium">실행 기록</h4>
      <Calendar
        className="border rounded-lg"
        highlightedDates={moveDates}
        onHighlightedDateClick={onDateClick}
        disabled={(date) => dayjs(date).isAfter(dayjs(), 'day')}
      />
    </div>
  );
}
