import { z } from 'zod';
import type {
  Category,
  FrequencyType,
  FrequencyUnit,
  Move,
  ActivityDetail,
} from '@/lib/actions';

// 루트 컴포넌트 Props
export interface LastMoveDetailModalProps {
  activityId: number;
  isOpen: boolean;
  onClose: () => void;
}

// Zod 스키마
export const activitySchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  category_id: z.number().optional(),
  description: z.string().optional(),
  frequency_type: z.enum(['preset', 'custom']),
  frequency_value: z.number().min(1),
  frequency_unit: z.enum(['days', 'weeks', 'months', 'quarters', 'years']),
});

export const moveSchema = z.object({
  executed_at: z.string().min(1, '실행 날짜는 필수입니다'),
  notes: z.string().optional(),
});

// 타입 정의
export type ActivityFormData = z.infer<typeof activitySchema>;
export type MoveFormData = z.infer<typeof moveSchema>;

// Move 관련 타입 (기존 인터페이스는 제거하고 zod에서 추론)
// export interface MoveFormData {
//   executed_at: string;
//   notes?: string;
// }

// 컴포넌트별 Props 인터페이스들
export interface ActivityInfoSectionProps {
  activity: ActivityDetail;
  isEditing: boolean;
  onActivityUpdate: (data: ActivityFormData) => Promise<void>;
  categories: Category[];
  onClose?: () => void;
}

export interface ActivityStatsProps {
  activity: ActivityDetail;
}

// 캘린더 관련 타입
export interface ExecutionCalendarProps {
  moves: Move[];
  onDateClick: (
    date: string,
    move: Move | null,
    position: { x: number; y: number },
  ) => void;
}

export interface MovePopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  selectedMove: Move | null;
  triggerPosition: { x: number; y: number } | null;
  onMoveCreate: (date: string, notes?: string) => Promise<void>;
  onMoveDelete: (moveId: number) => Promise<void>;
  isSubmitting: boolean;
}

// 상태 관리를 위한 인터페이스
export interface MovePopoverState {
  isOpen: boolean;
  selectedDate: Date | null;
  selectedMove: Move | null;
  triggerRef: HTMLElement | null;
  triggerPosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
}

// 활동 편집 관련 타입
export interface ActivityEditFormProps {
  activity: ActivityDetail;
  categories: Category[];
  onSubmit: (data: ActivityFormData) => Promise<void>;
}

// 재사용 타입들
export type { ActivityDetail, Move, Category } from '@/lib/actions';
