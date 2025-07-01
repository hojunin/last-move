'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ActivityDetail,
  Move,
  Category,
  getActivityDetail,
  getActivityMoves,
  getCategories,
  updateActivity,
  updateMove,
  deleteMove,
  createMoveWithDate,
} from '@/lib/actions';
import { daysSince } from '@/lib/utils';
import {
  Clock,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import dayjs from 'dayjs';
import { tv } from 'tailwind-variants';

interface LastMoveDetailModalProps {
  activityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const activitySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  category_id: z.number().optional(),
  description: z.string().optional(),
});

const moveSchema = z.object({
  executed_at: z.string().min(1, '날짜는 필수입니다'),
  notes: z.string().optional(),
});

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
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggerRef, setTriggerRef] = useState<HTMLElement | null>(null);
  const [triggerPosition, setTriggerPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // 활동 수정 폼
  const activityForm = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      category_id: undefined,
      description: '',
    },
  });

  // Move 수정 폼
  const moveForm = useForm<z.infer<typeof moveSchema>>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      executed_at: '',
      notes: '',
    },
  });

  // 데이터 로드 함수를 useCallback으로 감싸서 의존성 문제 해결
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

  // 활동 정보가 로드되면 폼 초기화
  useEffect(() => {
    if (activity) {
      activityForm.reset({
        title: activity.title,
        category_id: activity.category_id || undefined,
        description: activity.description || '',
      });
    }
  }, [activity, activityForm]);

  const handleActivityUpdate = async (data: z.infer<typeof activitySchema>) => {
    if (!activityId) return;

    try {
      const result = await updateActivity(activityId, data);
      if (result.success) {
        toast.success('활동이 수정되었습니다');
        setIsEditing(false);
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(result.error || '활동 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
      toast.error('활동 수정 중 오류가 발생했습니다');
    }
  };

  const handleMoveUpdate = async (data: z.infer<typeof moveSchema>) => {
    if (!selectedMove) return;

    setIsSubmitting(true);
    try {
      const result = await updateMove(selectedMove.id, data);
      if (result.success) {
        toast.success('기록이 수정되었습니다');
        setPopoverOpen(false);
        moveForm.reset();
        setSelectedMove(null);
        setSelectedDate(null);
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(result.error || '기록 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to update move:', error);
      toast.error('기록 수정 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveDelete = async (moveId: number) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    setIsSubmitting(true);
    try {
      const result = await deleteMove(moveId);
      if (result.success) {
        toast.success('기록이 삭제되었습니다');
        setPopoverOpen(false);
        setSelectedMove(null);
        setSelectedDate(null);
        await loadData(); // 데이터 새로고침
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

  const handleMoveCreate = async (data: z.infer<typeof moveSchema>) => {
    if (!activityId) return;

    setIsSubmitting(true);
    try {
      const result = await createMoveWithDate(
        activityId,
        data.executed_at,
        data.notes || undefined,
      );
      if (result.success) {
        toast.success('기록이 추가되었습니다');
        setPopoverOpen(false);
        moveForm.reset();
        setSelectedMove(null);
        setSelectedDate(null);
        await loadData(); // 데이터 새로고침
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

  const handleCalendarDateClick = (
    date: Date,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const moveOnDate = moves.find((move) =>
      dayjs(move.executed_at).isSame(dayjs(date), 'day'),
    );

    // 클릭된 버튼의 위치 계산
    const rect = event.currentTarget.getBoundingClientRect();
    setTriggerRef(event.currentTarget);
    setTriggerPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setSelectedDate(date);
    setSelectedMove(moveOnDate || null);
    setPopoverOpen(true);

    // 기존 Move가 있으면 편집 폼에 데이터 설정
    if (moveOnDate) {
      moveForm.reset({
        executed_at: dayjs(moveOnDate.executed_at).format('YYYY-MM-DD'),
        notes: moveOnDate.notes || '',
      });
    } else {
      // 새로운 Move 추가를 위해 선택된 날짜로 초기화
      moveForm.reset({
        executed_at: dayjs(date).format('YYYY-MM-DD'),
        notes: '',
      });
    }
  };

  const formatLastExecuted = (lastExecutedAt: string | null) => {
    if (!lastExecutedAt) return '기록 없음';

    const days = daysSince(lastExecutedAt);
    const formattedDate = dayjs(lastExecutedAt).format('YYYY-MM-DD');

    if (days === 0) return `오늘 (${formattedDate})`;
    if (days === 1) return `1일 전 (${formattedDate})`;
    return `${days}일 전 (${formattedDate})`;
  };

  // 공통 컨텐츠 컴포넌트
  const ModalContent = ({ className }: { className?: string }) => {
    if (!activity) {
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          {isLoading
            ? '데이터를 불러오는 중입니다...'
            : '활동을 찾을 수 없습니다'}
        </div>
      );
    }

    const moveDates = moves.map((move) => new Date(move.executed_at));

    return (
      <div className={`${className}`}>
        {/* 활동 정보 */}
        <div className="space-y-4">
          {!isEditing ? (
            // 읽기 모드
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
                {activity.category_name && (
                  <Badge variant="secondary" className="mb-2">
                    {activity.category_icon} {activity.category_name}
                  </Badge>
                )}
                {activity.description && (
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* 통계 정보 */}
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
                  <span className="text-muted-foreground">
                    {activity.move_count}회
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // 편집 모드
            <Form {...activityForm}>
              <form
                onSubmit={activityForm.handleSubmit(handleActivityUpdate)}
                className="space-y-4"
              >
                <FormField
                  control={activityForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="활동 제목을 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityForm.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value) : undefined)
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="활동 설명을 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </Button>
              </form>
            </Form>
          )}
        </div>

        {/* 달력 및 기록 관리 */}
        <div className="space-y-4 relative">
          <h4 className="font-medium">실행 기록</h4>
          <Calendar
            className="border rounded-lg"
            highlightedDates={moveDates}
            onHighlightedDateClick={handleCalendarDateClick}
            disabled={(date) => dayjs(date).isAfter(dayjs(), 'day')}
          />

          {triggerRef && triggerPosition && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  style={{
                    position: 'fixed',
                    top: triggerPosition.top,
                    left: triggerPosition.left,
                    width: triggerPosition.width,
                    height: triggerPosition.height,
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-72" side="right" align="center">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {selectedDate
                        ? dayjs(selectedDate).format('YYYY년 MM월 DD일')
                        : '날짜 선택됨'}
                    </h4>
                    {selectedMove ? (
                      <div className="p-2 bg-muted rounded-md">
                        <p className="text-sm font-medium">기존 기록</p>
                        {selectedMove.notes ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            메모: {selectedMove.notes}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            메모 없음
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        새 기록을 추가할 수 있습니다
                      </p>
                    )}
                  </div>

                  <Form {...moveForm}>
                    <form
                      onSubmit={moveForm.handleSubmit(
                        selectedMove ? handleMoveUpdate : handleMoveCreate,
                      )}
                      className="space-y-3"
                    >
                      {/* 날짜 필드 숨김 - 캘린더에서 이미 선택했으므로 */}
                      <FormField
                        control={moveForm.control}
                        name="executed_at"
                        render={() => <input type="hidden" />}
                      />

                      <FormField
                        control={moveForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>메모</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="메모를 입력하세요"
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 flex-wrap">
                        {selectedMove ? (
                          <>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isSubmitting}
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {isSubmitting ? '수정 중...' : '수정'}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting}
                              className="flex-1"
                              onClick={() =>
                                selectedMove &&
                                handleMoveDelete(selectedMove.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isSubmitting ? '삭제 중...' : '삭제'}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {isSubmitting ? '추가 중...' : '추가'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => setPopoverOpen(false)}
                        >
                          취소
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={sheetContentVariants({
          side: isDesktop ? 'right' : 'bottom',
        })}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>활동 상세 정보</SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
              {isEditing ? '취소' : '편집'}
            </Button>
          </div>
        </SheetHeader>
        <ModalContent className="p-4" />
      </SheetContent>
    </Sheet>
  );
}
