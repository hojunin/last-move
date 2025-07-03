import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ActivityNameInputProps } from './types';

export default function ActivityNameInput({
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  disabled = false,
  error,
}: ActivityNameInputProps) {
  return (
    <FormItem className="space-y-2">
      <FormLabel className="text-sm font-medium">
        활동명 <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder="예: 운동하기, 책 읽기, 물 마시기"
          disabled={disabled}
          autoFocus
          className="h-11 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </FormControl>
      {error && <FormMessage className="text-xs">{error}</FormMessage>}
    </FormItem>
  );
}
