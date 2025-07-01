'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

interface CalendarProps {
  className?: string;
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  highlightedDates?: Date[];
  onHighlightedDateClick?: (
    date: Date,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  disabled?: (date: Date) => boolean;
}

export function Calendar({
  className,
  selected,
  onSelect,
  highlightedDates = [],
  onHighlightedDateClick,
  disabled,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startOfWeek = startOfMonth.startOf('week');
  const endOfWeek = endOfMonth.endOf('week');

  const days = [];
  let current = startOfWeek;

  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    days.push(current);
    current = current.add(1, 'day');
  }

  const isDateHighlighted = (date: Dayjs) => {
    return highlightedDates.some((highlightedDate) =>
      dayjs(highlightedDate).isSame(date, 'day'),
    );
  };

  const isDateSelected = (date: Dayjs) => {
    return selected && dayjs(selected).isSame(date, 'day');
  };

  const isDateDisabled = (date: Dayjs) => {
    return disabled && disabled(date.toDate());
  };

  const handleDateClick = (
    date: Dayjs,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (isDateDisabled(date)) return;

    // onHighlightedDateClick이 있으면 모든 날짜에 대해 호출 (하이라이트 여부 무관)
    if (onHighlightedDateClick) {
      onHighlightedDateClick(date.toDate(), event);
    } else if (onSelect) {
      onSelect(date.toDate());
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  return (
    <div className={cn('p-3', className)}>
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {currentMonth.format('YYYY년 MM월')}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = day.isSame(currentMonth, 'month');
          const isToday = day.isSame(dayjs(), 'day');
          const highlighted = isDateHighlighted(day);
          const selectedDate = isDateSelected(day);
          const disabledDate = isDateDisabled(day);

          return (
            <Button
              key={day.format('YYYY-MM-DD')}
              variant="ghost"
              size="sm"
              onClick={(event) => handleDateClick(day, event)}
              disabled={disabledDate}
              className={cn(
                'h-8 w-8 p-0 font-normal relative',
                !isCurrentMonth && 'text-muted-foreground/50',
                isToday && 'bg-accent text-accent-foreground',
                selectedDate &&
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                highlighted &&
                  !selectedDate &&
                  'bg-blue-100 text-blue-900 hover:bg-blue-200',
                highlighted &&
                  selectedDate &&
                  'bg-primary text-primary-foreground',
                disabledDate && 'cursor-not-allowed opacity-50',
              )}
            >
              {day.format('D')}
              {highlighted && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
