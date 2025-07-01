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
} from '@/lib/actions';
import { daysSince } from '@/lib/utils';
import {
  Clock,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import dayjs from 'dayjs';

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
  const [editingMoveId, setEditingMoveId] = useState<number | null>(null);
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
    if (!editingMoveId) return;

    try {
      const result = await updateMove(editingMoveId, data);
      if (result.success) {
        toast.success('기록이 수정되었습니다');
        setEditingMoveId(null);
        moveForm.reset();
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(result.error || '기록 수정에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to update move:', error);
      toast.error('기록 수정 중 오류가 발생했습니다');
    }
  };

  const handleMoveDelete = async (moveId: number) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      const result = await deleteMove(moveId);
      if (result.success) {
        toast.success('기록이 삭제되었습니다');
        await loadData(); // 데이터 새로고침
      } else {
        toast.error(result.error || '기록 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete move:', error);
      toast.error('기록 삭제 중 오류가 발생했습니다');
    }
  };

  const handleMoveEdit = (move: Move) => {
    setEditingMoveId(move.id);
    moveForm.reset({
      executed_at: dayjs(move.executed_at).format('YYYY-MM-DD'),
      notes: move.notes || '',
    });
  };

  const handleMoveEditCancel = () => {
    setEditingMoveId(null);
    moveForm.reset();
  };

  const handleCalendarDateClick = (date: Date) => {
    const moveOnDate = moves.find((move) =>
      dayjs(move.executed_at).isSame(dayjs(date), 'day'),
    );
    if (moveOnDate) {
      handleMoveEdit(moveOnDate);
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
      <div className={`${className} space-y-6`}>
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

          {/* Move 편집 폼 */}
          {editingMoveId && (
            <div className="border rounded-lg p-4 mt-4">
              <h4 className="font-medium mb-3">기록 수정</h4>
              <Form {...moveForm}>
                <form
                  onSubmit={moveForm.handleSubmit(handleMoveUpdate)}
                  className="space-y-3"
                >
                  <FormField
                    control={moveForm.control}
                    name="executed_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>날짜</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={moveForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>메모</FormLabel>
                        <FormControl>
                          <Input placeholder="메모를 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMoveEditCancel}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>

        {/* 달력 및 기록 관리 */}
        <div className="space-y-4">
          <h4 className="font-medium">실행 기록</h4>
          <Calendar
            className="border rounded-lg"
            highlightedDates={moveDates}
            onHighlightedDateClick={handleCalendarDateClick}
            disabled={(date) => dayjs(date).isAfter(dayjs(), 'day')}
          />

          {/* 최근 기록 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h5 className="text-sm font-medium">최근 기록</h5>
            {moves.slice(0, 10).map((move) => (
              <div
                key={move.id}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div>
                  <div className="text-sm font-medium">
                    {dayjs(move.executed_at).format('YYYY-MM-DD')}
                  </div>
                  {move.notes && (
                    <div className="text-xs text-muted-foreground">
                      {move.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveEdit(move)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDelete(move.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={
          isDesktop
            ? 'w-[800px] sm:w-[800px] overflow-y-auto'
            : 'h-[90vh] overflow-y-auto'
        }
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
