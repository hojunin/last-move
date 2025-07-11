import { Button } from '@/components/ui/button';
import type { FormActionsProps } from './types';

export default function FormActions({
  onCancel,
  isValid,
  isComposing,
  isLoading,
}: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1 h-11"
        disabled={isLoading}
      >
        취소
      </Button>
      <Button
        type="submit"
        disabled={!isValid || isComposing || isLoading}
        className="flex-1 h-11 font-medium"
      >
        {isLoading ? '추가 중...' : '활동 추가'}
      </Button>
    </div>
  );
}
