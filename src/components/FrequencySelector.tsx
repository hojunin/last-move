'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { tv } from 'tailwind-variants';
import type { FrequencyType, FrequencyUnit } from '@/lib/actions';

export interface FrequencyData {
  type: FrequencyType;
  value: number;
  unit: FrequencyUnit;
}

interface FrequencySelectorProps {
  value: FrequencyData;
  onChange: (frequency: FrequencyData) => void;
  disabled?: boolean;
}

const presetOptions = [
  { label: '일', value: 1, unit: 'days' as FrequencyUnit },
  { label: '주', value: 1, unit: 'weeks' as FrequencyUnit },
  { label: '격주', value: 2, unit: 'weeks' as FrequencyUnit },
  { label: '개월', value: 1, unit: 'months' as FrequencyUnit },
  { label: '분기', value: 1, unit: 'quarters' as FrequencyUnit },
  { label: '반기', value: 6, unit: 'months' as FrequencyUnit },
  { label: '년', value: 1, unit: 'years' as FrequencyUnit },
];

const unitLabels: Record<FrequencyUnit, string> = {
  days: '일',
  weeks: '주',
  months: '개월',
  quarters: '분기',
  years: '년',
};

const badgeVariants = tv({
  base: 'cursor-pointer px-3 py-2 rounded-full text-base font-medium transition-colors',
  variants: {
    selected: {
      true: 'bg-primary text-primary-foreground',
      false: 'bg-muted text-muted-foreground hover:bg-primary/10',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
  },
  defaultVariants: {
    selected: false,
    disabled: false,
  },
});

export default function FrequencySelector({
  value,
  onChange,
  disabled = false,
}: FrequencySelectorProps) {
  const handlePresetSelect = (option: (typeof presetOptions)[0]) => {
    onChange({
      type: 'preset',
      value: option.value,
      unit: option.unit,
    });
  };

  const getDisplayText = () => {
    const preset = presetOptions.find(
      (option) => option.value === value.value && option.unit === value.unit,
    );
    return preset ? preset.label : `${value.value}${unitLabels[value.unit]}`;
  };

  const isPresetSelected = (option: (typeof presetOptions)[0]) => {
    return value.value === option.value && value.unit === option.unit;
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">활동 주기</Label>

      {/* 기본 옵션들 */}
      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => (
          <Badge
            key={`${option.value}-${option.unit}`}
            variant={isPresetSelected(option) ? 'default' : 'outline'}
            className={badgeVariants({
              selected: isPresetSelected(option),
              disabled,
            })}
            onClick={() => !disabled && handlePresetSelect(option)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
