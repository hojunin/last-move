'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityWithLastMove, createMove } from '@/lib/actions';
import { daysSince } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { gsap } from 'gsap';
import dayjs from 'dayjs';
import LastMoveDetailModal from '@/components/LastMoveDetailModal';

interface LastMoveCardProps {
  item: ActivityWithLastMove;
}

export default function LastMoveCard({ item }: LastMoveCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // NOTE: 마지막 실행일로부터 경과 일수 계산
  const days = item.last_executed_at ? daysSince(item.last_executed_at) : null;

  // NOTE: 오늘 이미 완료했는지 확인 (last_move_date 사용)
  const isCompletedToday = Boolean(
    item.last_move_date && dayjs(item.last_move_date).isSame(dayjs(), 'day'),
  );

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        },
      );
    }
  }, []);

  const handleLogAction = async (e: React.MouseEvent) => {
    // NOTE: 이벤트 버블링 방지
    e.stopPropagation();

    if (isCompletedToday) return;

    setIsLoading(true);

    // NOTE: 버튼 클릭 애니메이션
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
    }

    try {
      const result = await createMove(item.id);
      if (!result.success) {
        alert(result.error || 'Move 기록에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to log action:', error);
      alert('Move 기록 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    setIsDetailModalOpen(true);
  };

  // NOTE: 주기별 위험도 평가 함수
  const getRiskClasses = (
    days: number | null,
    frequency: { type: string; value: number; unit: string },
  ) => {
    if (days === null) return 'text-gray-600';
    if (days === 0) return 'text-green-600';

    const { value, unit } = frequency;

    // 주기를 시간(시)으로 변환
    let periodInHours = 0;
    switch (unit) {
      case 'days':
        periodInHours = value * 24;
        break;
      case 'weeks':
        periodInHours = value * 24 * 7;
        break;
      case 'months':
        periodInHours = value * 24 * 30; // 평균 30일
        break;
      case 'quarters':
        periodInHours = value * 24 * 90; // 3개월
        break;
      case 'years':
        periodInHours = value * 24 * 365;
        break;
      default:
        periodInHours = 24; // 기본값: 하루
    }

    const hoursElapsed = days * 24;

    // 주기별 색상 단계 정의
    let colorSteps: number[] = [];

    if (unit === 'days') {
      // 일 단위: 3단계 (초록, 노랑, 주황, 빨강)
      colorSteps = [
        periodInHours * 0.8, // 80% 지나면 노랑
        periodInHours * 0.95, // 95% 지나면 주황
        periodInHours, // 100% 지나면 빨강
      ];
    } else if (unit === 'weeks') {
      // 주 단위: 5단계
      colorSteps = [
        periodInHours * 0.6, // 60% - 노랑
        periodInHours * 0.75, // 75% - 주황
        periodInHours * 0.9, // 90% - 진한 주황
        periodInHours * 0.98, // 98% - 연한 빨강
        periodInHours, // 100% - 빨강
      ];
    } else if (unit === 'months') {
      // 월 단위: 7단계
      colorSteps = [
        periodInHours * 0.5, // 50% - 연한 노랑
        periodInHours * 0.65, // 65% - 노랑
        periodInHours * 0.75, // 75% - 진한 노랑
        periodInHours * 0.85, // 85% - 연한 주황
        periodInHours * 0.92, // 92% - 주황
        periodInHours * 0.97, // 97% - 진한 주황
        periodInHours, // 100% - 빨강
      ];
    } else if (unit === 'quarters') {
      // 분기 단위: 10단계
      colorSteps = [
        periodInHours * 0.4, // 40% - 연한 초록
        periodInHours * 0.5, // 50% - 연한 노랑
        periodInHours * 0.6, // 60% - 노랑
        periodInHours * 0.7, // 70% - 진한 노랑
        periodInHours * 0.78, // 78% - 연한 주황
        periodInHours * 0.85, // 85% - 주황
        periodInHours * 0.9, // 90% - 진한 주황
        periodInHours * 0.95, // 95% - 연한 빨강
        periodInHours * 0.98, // 98% - 빨강
        periodInHours, // 100% - 진한 빨강
      ];
    } else {
      // years
      // 년 단위: 15단계
      colorSteps = [
        periodInHours * 0.3, // 30% - 연한 초록
        periodInHours * 0.4, // 40% - 초록
        periodInHours * 0.5, // 50% - 연한 노랑
        periodInHours * 0.58, // 58% - 노랑
        periodInHours * 0.65, // 65% - 진한 노랑
        periodInHours * 0.72, // 72% - 연한 주황
        periodInHours * 0.78, // 78% - 주황
        periodInHours * 0.83, // 83% - 진한 주황
        periodInHours * 0.87, // 87% - 매우 진한 주황
        periodInHours * 0.91, // 91% - 연한 빨강
        periodInHours * 0.94, // 94% - 빨강
        periodInHours * 0.97, // 97% - 진한 빨강
        periodInHours * 0.99, // 99% - 매우 진한 빨강
        periodInHours, // 100% - 위험 빨강
      ];
    }

    // 색상 결정 및 애니메이션 추가
    if (hoursElapsed < colorSteps[0]) {
      return 'text-green-600 safe-glow'; // 안전 + 초록 glow
    } else if (hoursElapsed < colorSteps[1]) {
      return 'text-yellow-500 caution-glow'; // 주의 + 노랑 glow
    } else if (hoursElapsed < colorSteps[2]) {
      return 'text-orange-500'; // 경고
    } else if (colorSteps.length > 3 && hoursElapsed < colorSteps[3]) {
      return 'text-orange-600'; // 진한 경고
    } else if (colorSteps.length > 4 && hoursElapsed < colorSteps[4]) {
      return 'text-red-400'; // 연한 위험
    } else if (colorSteps.length > 5 && hoursElapsed < colorSteps[5]) {
      return 'text-red-500'; // 위험
    } else if (colorSteps.length > 6 && hoursElapsed < colorSteps[6]) {
      return 'text-red-600'; // 진한 위험
    } else if (colorSteps.length > 7 && hoursElapsed < colorSteps[7]) {
      return 'text-red-700 animate-pulse'; // 매우 위험 + pulse (glow 제거)
    } else {
      return 'text-red-800 animate-pulse'; // 극도로 위험 + pulse (glow 제거)
    }
  };

  const getDaysText = (days: number | null) => {
    if (days === null) return 'No record';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className="bg-white border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow duration-200 h-fit cursor-pointer"
      >
        <div className="flex items-center justify-between">
          {/* 제목과 카테고리 */}
          <div className="flex flex-col justify-between gap-1">
            <h3 className="font-medium text-sm truncate pr-2 leading-tight">
              {item.title}
            </h3>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span
                className={`text-xs font-medium ${getRiskClasses(days, {
                  type: item.frequency_type,
                  value: item.frequency_value,
                  unit: item.frequency_unit,
                })}`}
              >
                {getDaysText(days)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleLogAction}
            disabled={isLoading || isCompletedToday}
            variant={isCompletedToday ? 'secondary' : 'default'}
            size="sm"
            className="px-2 text-xs"
          >
            {isLoading ? 'Processing' : isCompletedToday ? '✓' : 'Done'}
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <LastMoveDetailModal
        activityId={item.id}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  );
}
