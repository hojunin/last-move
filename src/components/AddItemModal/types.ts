import { z } from 'zod';
import type { Category, FrequencyType, FrequencyUnit } from '@/lib/actions';

// NOTE: 새 활동 생성 폼 스키마 (단순화)
export const newActivitySchema = z.object({
  title: z
    .string()
    .min(1, '활동명을 입력해주세요')
    .max(100, '활동명은 100자 이하로 입력해주세요'),
  category_id: z.number({
    required_error: '카테고리를 선택해주세요',
  }),
  frequency_type: z.enum(['preset', 'custom']),
  frequency_value: z.number().min(1),
  frequency_unit: z.enum(['days', 'weeks', 'months', 'quarters', 'years']),
});

// NOTE: 새 활동 생성 폼 데이터 타입
export type NewActivityFormData = z.infer<typeof newActivitySchema>;

// NOTE: 컴포넌트 Props 타입들
export interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AddItemFormProps {
  onSubmit: (data: NewActivityFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface ActivityNameInputProps {
  value: string;
  onChange: (value: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  disabled?: boolean;
  error?: string;
}

export interface CategorySelectProps {
  value: number | undefined;
  onChange: (value: number) => void;
  categories: Category[];
  disabled?: boolean;
  error?: string;
}

export interface FormActionsProps {
  onCancel: () => void;
  isValid: boolean;
  isComposing: boolean;
  isLoading: boolean;
}

// NOTE: 폼 상태 관리 타입
export interface FormState {
  isComposing: boolean;
  categories: Category[];
  error: string | null;
}
