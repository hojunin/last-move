import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// NOTE: 특정 날짜로부터 경과된 일수를 계산하는 함수
export function daysSince(dateString: string): number {
  const targetDate = dayjs(dateString).startOf('day');
  const now = dayjs().startOf('day');
  return now.diff(targetDate, 'day');
}
