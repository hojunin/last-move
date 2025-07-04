import { z } from "zod";
import { ActivityDetail, Move, Category } from "@/lib/actions";

// 루트 컴포넌트 Props
export interface LastMoveDetailModalProps {
  activityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Zod 스키마
export const activitySchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  category_id: z.number().optional(),
  description: z.string().optional(),
});

export const moveSchema = z.object({
  executed_at: z.string().min(1, "날짜는 필수입니다"),
});

// 타입 추론
export type ActivityFormData = z.infer<typeof activitySchema>;
export type MoveFormData = z.infer<typeof moveSchema>;

// 컴포넌트별 Props 인터페이스들
export interface ActivityInfoSectionProps {
  activity: ActivityDetail;
  isEditing: boolean;
  onActivityUpdate: (data: ActivityFormData) => Promise<void>;
  categories: Category[];
}

export interface ActivityStatsProps {
  activity: ActivityDetail;
}

export interface ExecutionCalendarProps {
  moves: Move[];
  onDateClick: (date: Date, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface MovePopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedMove: Move | null;
  triggerPosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
  onMoveCreate: (data: MoveFormData) => Promise<void>;
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

// 재사용 타입들
export type { ActivityDetail, Move, Category } from "@/lib/actions";
