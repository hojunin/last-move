import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FrequencySelector from '../FrequencySelector';
import { deleteActivity } from '@/lib/actions';
import {
  activitySchema,
  ActivityFormData,
  type Category,
  type ActivityDetail,
} from './types';

interface ActivityEditFormProps {
  activity: ActivityDetail;
  categories: Category[];
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onClose?: () => void;
}

export default function ActivityEditForm({
  activity,
  categories,
  onSubmit,
  onClose,
}: ActivityEditFormProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      category_id: undefined,
      description: '',
      frequency_type: 'preset',
      frequency_value: 1,
      frequency_unit: 'days',
    },
  });

  // NOTE: frequency 필드들을 실시간으로 추적
  const watchedFrequencyType = useWatch({
    control: form.control,
    name: 'frequency_type',
  });
  const watchedFrequencyValue = useWatch({
    control: form.control,
    name: 'frequency_value',
  });
  const watchedFrequencyUnit = useWatch({
    control: form.control,
    name: 'frequency_unit',
  });

  // 활동 정보가 로드되면 폼 초기화
  useEffect(() => {
    // 카테고리 데이터가 로드되지 않았으면 초기화하지 않음
    if (categories.length === 0) return;

    console.log('ActivityEditForm: activity loaded', activity);
    console.log('ActivityEditForm: categories', categories);

    form.reset({
      title: activity.title,
      category_id: activity.category_id ? activity.category_id : undefined,
      description: activity.description || '',
      frequency_type: activity.frequency_type,
      frequency_value: activity.frequency_value,
      frequency_unit: activity.frequency_unit,
    });
  }, [activity, categories, form]);

  // 삭제 핸들러
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteActivity(activity.id);

      if (result.success) {
        toast.success('활동이 삭제되었습니다');
        setShowDeleteConfirm(false);
        onClose?.();
      } else {
        toast.error(result.error || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>활동명</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="활동명을 입력하세요" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                {categories.length > 0 ? (
                  <Select
                    key={`${field.value}-${categories.length}`} // 강제 리렌더링
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ''}
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
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-gray-50">
                    <span className="text-gray-500">카테고리 로딩 중...</span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="활동 설명을 입력하세요" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FrequencySelector
            value={{
              type: watchedFrequencyType,
              value: watchedFrequencyValue,
              unit: watchedFrequencyUnit,
            }}
            onChange={(frequency) => {
              form.setValue('frequency_type', frequency.type);
              form.setValue('frequency_value', frequency.value);
              form.setValue('frequency_unit', frequency.unit);
            }}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>

      {/* 삭제 확인 모달 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>활동 삭제</DialogTitle>
            <DialogDescription>
              "{activity.title}" 활동을 정말 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                삭제된 활동은 복구할 수 없습니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
