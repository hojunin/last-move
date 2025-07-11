import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/ui/form';
import { getCategories } from '@/lib/actions';
import ActivityNameInput from './ActivityNameInput';
import CategorySelect from './CategorySelect';
import FormActions from './FormActions';
import FrequencySelector from '../FrequencySelector';
import type { AddItemFormProps, NewActivityFormData, FormState } from './types';
import { newActivitySchema } from './types';

export default function AddItemForm({
  onSubmit,
  onCancel,
  isLoading,
  error,
}: AddItemFormProps) {
  // NOTE: 폼 상태 관리
  const [formState, setFormState] = useState<FormState>({
    isComposing: false,
    categories: [],
    error: null,
  });

  // NOTE: react-hook-form 설정
  const form = useForm<NewActivityFormData>({
    resolver: zodResolver(newActivitySchema),
    defaultValues: {
      title: '',
      category_id: undefined,
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

  // NOTE: 카테고리 목록 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryList = await getCategories();
        setFormState((prev) => ({ ...prev, categories: categoryList }));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setFormState((prev) => ({
          ...prev,
          error: '카테고리를 불러오는데 실패했습니다.',
        }));
      }
    };

    fetchCategories();
  }, []);

  // NOTE: 한글 입력 상태 관리 함수들
  const handleCompositionStart = () => {
    setFormState((prev) => ({ ...prev, isComposing: true }));
  };

  const handleCompositionEnd = () => {
    setFormState((prev) => ({ ...prev, isComposing: false }));
  };

  // NOTE: 폼 제출 핸들러
  const handleSubmit = async (data: NewActivityFormData) => {
    await onSubmit(data);
    form.reset();
  };

  // NOTE: 취소 핸들러
  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* 활동명 입력 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <ActivityNameInput
              value={field.value}
              onChange={field.onChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              disabled={isLoading}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* 카테고리 선택 */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field, fieldState }) => (
            <CategorySelect
              value={field.value}
              onChange={field.onChange}
              categories={formState.categories}
              disabled={isLoading}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* 주기 선택 */}
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
          disabled={isLoading}
        />

        {/* 에러 메시지 표시 */}
        {(error || formState.error) && (
          <div className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-md">
            {error || formState.error}
          </div>
        )}

        {/* 액션 버튼들 */}
        <FormActions
          onCancel={handleCancel}
          isValid={form.formState.isValid}
          isComposing={formState.isComposing}
          isLoading={isLoading}
        />
      </form>
    </Form>
  );
}
