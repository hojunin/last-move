import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import MoveForm from './MoveForm';
import { MovePopoverProps } from './types';
import dayjs from 'dayjs';

export default function MovePopover({
  isOpen,
  onOpenChange,
  selectedDate,
  selectedMove,
  triggerPosition,
  onMoveCreate,
  onMoveDelete,
  isSubmitting,
}: MovePopoverProps) {
  if (!triggerPosition) return null;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
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
      <PopoverContent className="w-44" side="right" align="center">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">
              {selectedDate
                ? dayjs(selectedDate).format('YYYY년 MM월 DD일')
                : '날짜 선택됨'}
            </h4>
          </div>

          <MoveForm
            selectedDate={selectedDate}
            selectedMove={selectedMove}
            onMoveCreate={onMoveCreate}
            onMoveDelete={onMoveDelete}
            isSubmitting={isSubmitting}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
