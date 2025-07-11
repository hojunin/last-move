import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Trash2, Plus } from 'lucide-react';
import { moveSchema, MoveFormData, type Move } from './types';
import dayjs from 'dayjs';

interface MoveFormProps {
  selectedDate: Date | null;
  selectedMove: Move | null;
  onMoveCreate: (data: MoveFormData) => Promise<void>;
  onMoveDelete: (moveId: number) => Promise<void>;
  isSubmitting: boolean;
}

export default function MoveForm({
  selectedDate,
  selectedMove,
  onMoveCreate,
  onMoveDelete,
  isSubmitting,
}: MoveFormProps) {
  const form = useForm<MoveFormData>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      executed_at: '',
    },
  });

  // 선택된 날짜나 Move가 변경되면 폼 초기화
  useEffect(() => {
    if (selectedMove) {
      form.reset({
        executed_at: dayjs(selectedMove.executed_at).format('YYYY-MM-DD'),
      });
    } else if (selectedDate) {
      form.reset({
        executed_at: dayjs(selectedDate).format('YYYY-MM-DD'),
      });
    }
  }, [selectedDate, selectedMove, form]);

  const handleSubmit = (data: MoveFormData) => {
    // 수정 기능 제거 - 추가만 가능
    return onMoveCreate(data);
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
        <FormField
          control={form.control}
          name="executed_at"
          render={() => <input type="hidden" />}
        />
        <div className="flex gap-2 flex-wrap">
          {selectedMove ? (
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
        </div>
      </form>
    </Form>
  );
}
