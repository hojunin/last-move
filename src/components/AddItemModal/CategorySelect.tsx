import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CategorySelectProps } from './types';

export default function CategorySelect({
  value,
  onChange,
  categories,
  disabled = false,
  error,
}: CategorySelectProps) {
  return (
    <FormItem className="space-y-2">
      <FormLabel className="text-sm font-medium">
        카테고리 <span className="text-destructive">*</span>
      </FormLabel>
      <Select
        onValueChange={(value) => onChange(parseInt(value))}
        value={value?.toString()}
        disabled={disabled}
      >
        <FormControl>
          <SelectTrigger className="h-11 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FormMessage className="text-xs">{error}</FormMessage>}
    </FormItem>
  );
}
