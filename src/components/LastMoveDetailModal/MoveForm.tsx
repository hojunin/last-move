import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Save, Trash2, Plus } from 'lucide-react';
import { moveSchema, MoveFormData, type Move } from './types';
import dayjs from 'dayjs';

interface MoveFormProps {
  selectedDate: Date | null;
  selectedMove: Move | null;
  onMoveUpdate: (data: MoveFormData) => Promise<void>;
  onMoveCreate: (data: MoveFormData) => Promise<void>;
  onMoveDelete: (moveId: number) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function MoveForm({
  selectedDate,
  selectedMove,
  onMoveUpdate,
  onMoveCreate,
  onMoveDelete,
  onCancel,
  isSubmitting,
}: MoveFormProps) {
  const form = useForm<MoveFormData>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      executed_at: '',
      notes: '',
    },
  });

  // 선택된 날짜나 Move가 변경되면 폼 초기화
  useEffect(() => {
    if (selectedMove) {
      form.reset({
        executed_at: dayjs(selectedMove.executed_at).format('YYYY-MM-DD'),
        notes: selectedMove.notes || '',
      });
    } else if (selectedDate) {
      form.reset({
        executed_at: dayjs(selectedDate).format('YYYY-MM-DD'),
        notes: '',
      });
    }
  }, [selectedDate, selectedMove, form]);

  const handleSubmit = (data: MoveFormData) => {
    if (selectedMove) {
      return onMoveUpdate(data);
    } else {
      return onMoveCreate(data);
    }
  };

  const handleDelete = () => {
    if (selectedMove && !confirm('이 기록을 삭제하시겠습니까?')) return;
    if (selectedMove) {
      onMoveDelete(selectedMove.id);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        {/* 날짜 필드 숨김 - 캘린더에서 이미 선택했으므로 */}
        <FormField
          control={form.control}
          name="executed_at"
          render={() => <input type="hidden" />}
        />

        <FormField
          control={form.control}
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
                onClick={handleDelete}
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
            onClick={onCancel}
          >
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
