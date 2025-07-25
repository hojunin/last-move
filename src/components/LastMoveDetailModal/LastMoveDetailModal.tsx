'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Edit2, X } from 'lucide-react';
import { tv } from 'tailwind-variants';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';

import {
  getActivityDetail,
  getActivityMoves,
  getCategories,
  updateActivity,
  deleteMove,
  createMoveWithDate,
} from '@/lib/actions';

import ActivityInfoSection from './ActivityInfoSection';
import ExecutionCalendar from './ExecutionCalendar';
import MovePopover from './MovePopover';
import DetailModalSkeleton from './DetailModalSkeleton';
import {
  LastMoveDetailModalProps,
  ActivityDetail,
  Move,
  Category,
  ActivityFormData,
  MoveFormData,
  MovePopoverState,
} from './types';
import { Badge } from '../ui/badge';

const sheetContentVariants = tv({
  base: 'overflow-y-auto',
  variants: {
    side: {
      right: '',
      bottom: 'h-auto max-h-[65vh]',
    },
  },
  defaultVariants: {
    side: 'bottom',
  },
});

export default function LastMoveDetailModal({
  activityId,
  isOpen,
  onClose,
}: LastMoveDetailModalProps) {
  // 기본 상태
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popover 상태
  const [popoverState, setPopoverState] = useState<MovePopoverState>({
    isOpen: false,
    selectedDate: null,
    selectedMove: null,
    triggerRef: null,
    triggerPosition: null,
  });

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    if (!activityId) return;

    setIsLoading(true);
    try {
      const [activityData, movesData, categoriesData] = await Promise.all([
        getActivityDetail(activityId),
        getActivityMoves(activityId),
        getCategories(),
      ]);

      setActivity(activityData);
      setMoves(movesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('데이터 로드에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  // 데이터 로드
  useEffect(() => {
    if (activityId && isOpen) {
      loadData();
    }
  }, [activityId, isOpen, loadData]);

  // 활동 업데이트 핸들러
  const handleActivityUpdate = async (data: ActivityFormData) => {
    if (!activityId) return;

    try {
      const result = await updateActivity(activityId, data);
      if (result.success) {
        toast.success('활동이 수정되었습니다');
        setIsEditing(false);
        await loadData();
      } else {
        toast.error(result.error || '활동 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
      toast.error('활동 수정 중 오류가 발생했습니다');
    }
  };

  // Move 업데이트 핸들러 제거 - 수정 기능 제거됨

  // Move 생성 핸들러
  const handleMoveCreate = async (data: MoveFormData) => {
    if (!activityId) return;

    setIsSubmitting(true);
    try {
      const result = await createMoveWithDate(activityId, data.executed_at);
      if (result.success) {
        toast.success('기록이 추가되었습니다');
        setPopoverState((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      } else {
        toast.error(result.error || '기록 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to create move:', error);
      toast.error('기록 추가 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move 삭제 핸들러
  const handleMoveDelete = async (moveId: number) => {
    setIsSubmitting(true);
    try {
      const result = await deleteMove(moveId);
      if (result.success) {
        toast.success('기록이 삭제되었습니다');
        setPopoverState((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      } else {
        toast.error(result.error || '기록 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete move:', error);
      toast.error('기록 삭제 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 캘린더 날짜 클릭 핸들러
  const handleCalendarDateClick = (
    date: Date,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const moveOnDate = moves.find((move) =>
      dayjs(move.executed_at).isSame(dayjs(date), 'day'),
    );

    // 클릭된 버튼의 위치 계산
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      selectedDate: date,
      selectedMove: moveOnDate || null,
      triggerRef: event.currentTarget,
      triggerPosition: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  // Popover 상태 변경 핸들러
  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverState((prev) => ({ ...prev, isOpen: open }));
  };

  // 편집 모드 토글
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Sheet 닫기 핸들러 (상태 초기화 포함)
  const handleSheetClose = (open: boolean) => {
    if (!open) {
      // Sheet가 닫힐 때 편집 모드 초기화
      setIsEditing(false);
      // Popover 상태도 초기화
      setPopoverState({
        isOpen: false,
        selectedDate: null,
        selectedMove: null,
        triggerRef: null,
        triggerPosition: null,
      });
      // 원래 onClose 함수 호출
      onClose();
    }
  };

  // 로딩 상태
  if (!activity && isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={handleSheetClose}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          showClose={false}
          className={sheetContentVariants({
            side: isDesktop ? 'right' : 'bottom',
          })}
        >
          <SheetHeader>
            <SheetTitle>로딩 중...</SheetTitle>
          </SheetHeader>
          <DetailModalSkeleton />
        </SheetContent>
      </Sheet>
    );
  }

  // 활동이 없는 경우
  if (!activity) {
    return (
      <Sheet open={isOpen} onOpenChange={handleSheetClose}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          showClose={false}
          className={sheetContentVariants({
            side: isDesktop ? 'right' : 'bottom',
          })}
        >
          <SheetHeader>
            <SheetTitle>활동을 찾을 수 없습니다</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center p-8">
            활동을 찾을 수 없습니다
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        showClose={false}
        className={sheetContentVariants({
          side: isDesktop ? 'right' : 'bottom',
        })}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{activity.title}</h3>
                {activity.category_name && (
                  <Badge variant="secondary">
                    {activity.category_icon} {activity.category_name}
                  </Badge>
                )}
              </div>
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={handleEditToggle}>
              {isEditing ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
              {isEditing ? '취소' : '편집'}
            </Button>
          </div>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-6">
          {/* 활동 정보 섹션 */}
          <ActivityInfoSection
            activity={activity}
            isEditing={isEditing}
            onActivityUpdate={handleActivityUpdate}
            categories={categories}
            onClose={handleSheetClose.bind(null, false)}
          />

          {/* 실행 캘린더 */}
          <div className="relative">
            <ExecutionCalendar
              moves={moves}
              onDateClick={handleCalendarDateClick}
            />

            {/* Move 관리 Popover */}
            {popoverState.triggerPosition && (
              <MovePopover
                isOpen={popoverState.isOpen}
                onOpenChange={handlePopoverOpenChange}
                selectedDate={popoverState.selectedDate}
                selectedMove={popoverState.selectedMove}
                triggerPosition={popoverState.triggerPosition}
                onMoveCreate={handleMoveCreate}
                onMoveDelete={handleMoveDelete}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
