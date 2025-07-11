'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';

export interface ActivityFilter {
  categoryIds: number[];
  frequencies: string[];
  frequencyTypes: ('preset' | 'custom')[];
}

interface ActivityFilterProps {
  categories: Array<{
    id: number;
    name: string;
    icon: string | null;
  }>;
  currentFilter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}

const frequencyOptions = [
  { value: 'daily', label: '하루에 1회' },
  { value: 'weekly', label: '1주에 1회' },
  { value: 'bi-weekly', label: '2주에 1회' },
  { value: 'monthly', label: '1달에 1회' },
  { value: 'quarterly', label: '분기에 1회' },
  { value: 'yearly', label: '1년에 1회' },
  { value: 'custom', label: '커스텀 주기' },
];

export default function ActivityFilter({
  categories,
  currentFilter,
  onFilterChange,
}: ActivityFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 임시 상태로 칩 선택 관리
  const [tempCategoryIds, setTempCategoryIds] = useState<number[]>(
    currentFilter.categoryIds,
  );
  const [tempFrequencies, setTempFrequencies] = useState<string[]>(
    currentFilter.frequencies,
  );

  // Sheet 열릴 때마다 임시 상태를 현재 필터로 동기화
  useEffect(() => {
    if (isOpen) {
      setTempCategoryIds(currentFilter.categoryIds);
      setTempFrequencies(currentFilter.frequencies);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 전체 칩 활성화 여부 (카테고리)
  const isAllCategory = tempCategoryIds.length === categories.length;
  // 전체 칩 활성화 여부 (노출기간)
  const isAllFrequency = tempFrequencies.length === frequencyOptions.length;

  // 필터 요약 텍스트
  const getFilterDisplayText = () => {
    const filters: string[] = [];
    if (!isAllCategory && tempCategoryIds.length > 0) {
      filters.push(
        tempCategoryIds
          .map((id) => categories.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(', '),
      );
    }
    if (!isAllFrequency && tempFrequencies.length > 0) {
      filters.push(
        tempFrequencies
          .map((f) => frequencyOptions.find((o) => o.value === f)?.label)
          .filter(Boolean)
          .join(', '),
      );
    }
    return filters.filter(Boolean).length > 0 ? filters.join(', ') : '전체';
  };

  // 카테고리 칩 클릭 핸들러 (임시 상태만 변경)
  const handleCategoryClick = (id: number | 'all') => {
    if (id === 'all') {
      if (isAllCategory) return setTempCategoryIds([]);
      return setTempCategoryIds(categories.map((c) => c.id));
    }
    let newIds = [...tempCategoryIds];
    if (newIds.includes(id)) {
      newIds = newIds.filter((cid) => cid !== id);
      if (newIds.length === categories.length)
        return setTempCategoryIds(categories.map((c) => c.id));
      return setTempCategoryIds(newIds);
    }
    newIds.push(id);
    if (newIds.length === categories.length)
      return setTempCategoryIds(categories.map((c) => c.id));
    return setTempCategoryIds(newIds);
  };

  // 노출 기간 칩 클릭 핸들러 (임시 상태만 변경)
  const handleFrequencyClick = (value: string | 'all') => {
    if (value === 'all') {
      if (isAllFrequency) return setTempFrequencies([]);
      return setTempFrequencies(frequencyOptions.map((o) => o.value));
    }
    let newFreqs = [...tempFrequencies];
    if (newFreqs.includes(value)) {
      newFreqs = newFreqs.filter((f) => f !== value);
      if (newFreqs.length === frequencyOptions.length)
        return setTempFrequencies(frequencyOptions.map((o) => o.value));
      return setTempFrequencies(newFreqs);
    }
    newFreqs.push(value);
    if (newFreqs.length === frequencyOptions.length)
      return setTempFrequencies(frequencyOptions.map((o) => o.value));
    return setTempFrequencies(newFreqs);
  };

  // 적용 버튼 클릭 시 실제 필터 반영
  const handleApply = () => {
    onFilterChange({
      categoryIds: tempCategoryIds,
      frequencies: tempFrequencies,
      frequencyTypes: [],
    });
    setIsOpen(false);
  };

  // 초기화 버튼 클릭 시 임시 상태도 초기화
  const clearFilters = () => {
    setTempCategoryIds([]);
    setTempFrequencies([]);
    setIsOpen(false);
    onFilterChange({ categoryIds: [], frequencies: [], frequencyTypes: [] });
  };

  const hasActiveFilters =
    currentFilter.categoryIds.length > 0 ||
    currentFilter.frequencies.length > 0;

  return (
    <div className="mb-6">
      {/* 필터 요약 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex gap-2 rounded-full px-4 py-2 shadow-sm border-muted-foreground/20 hover:border-primary max-w-[320px]"
        >
          <Filter className="h-4 w-4 shrink-0" />
          <span className="font-medium text-base truncate block max-w-[220px]">
            {getFilterDisplayText()}
          </span>
        </Button>
      </div>

      {/* Facit 스타일 필터 Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-4 bg-white shadow-xl flex flex-col"
        >
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">필터 설정</SheetTitle>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-6">
            {/* 카테고리 필터 - Badge 버튼 */}
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="category-filter"
                className="text-base font-semibold mb-1"
              >
                카테고리
              </Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={isAllCategory ? 'default' : 'outline'}
                  className={`cursor-pointer px-2 py-1 rounded-full text-sm font-medium transition-colors ${
                    isAllCategory
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10'
                  }`}
                  onClick={() => handleCategoryClick('all')}
                >
                  전체
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={
                      tempCategoryIds.includes(category.id)
                        ? 'default'
                        : 'outline'
                    }
                    className={`cursor-pointer px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                      tempCategoryIds.includes(category.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10'
                    }`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.icon && (
                      <span className="text-xs">{category.icon}</span>
                    )}
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 노출 기간 필터 - Badge 버튼 */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="frequency-filter"
                className="text-base font-semibold mb-1"
              >
                노출 기간
              </Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={isAllFrequency ? 'default' : 'outline'}
                  className={`cursor-pointer px-2 py-1 rounded-full text-sm font-medium transition-colors ${
                    isAllFrequency
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10'
                  }`}
                  onClick={() => handleFrequencyClick('all')}
                >
                  전체
                </Badge>
                {frequencyOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={
                      tempFrequencies.includes(option.value)
                        ? 'default'
                        : 'outline'
                    }
                    className={`cursor-pointer px-2 py-1 rounded-full text-sm font-medium transition-colors ${
                      tempFrequencies.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10'
                    }`}
                    onClick={() => handleFrequencyClick(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 rounded-lg py-2 text-base border-muted-foreground/30"
            >
              필터 초기화
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 rounded-lg py-2 text-base font-semibold shadow-sm"
            >
              적용
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
