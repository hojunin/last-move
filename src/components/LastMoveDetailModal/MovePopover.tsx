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
  onMoveUpdate,
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
      <PopoverContent className="w-72" side="right" align="center">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">
              {selectedDate
                ? dayjs(selectedDate).format('YYYY년 MM월 DD일')
                : '날짜 선택됨'}
            </h4>
            {selectedMove ? (
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">기존 기록</p>
                {selectedMove.notes ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    메모: {selectedMove.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    메모 없음
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                새 기록을 추가할 수 있습니다
              </p>
            )}
          </div>

          <MoveForm
            selectedDate={selectedDate}
            selectedMove={selectedMove}
            onMoveUpdate={onMoveUpdate}
            onMoveCreate={onMoveCreate}
            onMoveDelete={onMoveDelete}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
