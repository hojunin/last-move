import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
import { Save } from 'lucide-react';
import FrequencySelector from '../FrequencySelector';
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
}

export default function ActivityEditForm({
  activity,
  categories,
  onSubmit,
}: ActivityEditFormProps) {
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

  return (
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

        <Button type="submit" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          저장
        </Button>
      </form>
    </Form>
  );
}
