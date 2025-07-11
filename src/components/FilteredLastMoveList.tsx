'use client';

import { useState, useMemo } from 'react';
import { ActivityWithLastMove } from '@/lib/actions';
import { Category } from '@/lib/actions';
import LastMoveList from '@/components/LastMoveList';
import ActivityFilter, {
  ActivityFilter as ActivityFilterType,
} from '@/components/ActivityFilter';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const FILTER_KEY = 'activity-facet-filter';
const DEFAULT_FILTER: ActivityFilterType = {
  categoryIds: [],
  frequencies: [],
  frequencyTypes: [],
};

interface FilteredLastMoveListProps {
  items: ActivityWithLastMove[];
  categories: Category[];
}

// 활동의 frequency 정보를 frequencyOptions의 value로 변환하는 함수
const getFrequencyKey = (
  frequency_value: number,
  frequency_unit: string,
): string => {
  // 기본 주기에 대한 매핑
  if (frequency_value === 1) {
    switch (frequency_unit) {
      case 'days':
        return 'daily';
      case 'weeks':
        return 'weekly';
      case 'months':
        return 'monthly';
      case 'quarters':
        return 'quarterly';
      case 'years':
        return 'yearly';
      default:
        return 'custom';
    }
  }

  // 특별한 경우: 2주에 1회 (bi-weekly)
  if (frequency_value === 2 && frequency_unit === 'weeks') {
    return 'bi-weekly';
  }

  // 그 외 모든 커스텀 주기
  return 'custom';
};

export default function FilteredLastMoveList({
  items,
  categories,
}: FilteredLastMoveListProps) {
  // localStorage 연동 필터 상태
  const [filter, setFilter, removeFilter] = useLocalStorage<ActivityFilterType>(
    FILTER_KEY,
    DEFAULT_FILTER,
  );

  // NOTE: 필터링된 아이템 계산
  const filteredItems = useMemo(() => {
    let filtered = items;

    // 카테고리 멀티 필터
    if (filter.categoryIds.length > 0) {
      filtered = filtered.filter(
        (item) =>
          item.category_id && filter.categoryIds.includes(item.category_id),
      );
    }

    // 노출 기간 멀티 필터
    if (filter.frequencies.length > 0) {
      filtered = filtered.filter((item) => {
        const activityFrequencyKey = getFrequencyKey(
          item.frequency_value,
          item.frequency_unit,
        );
        return filter.frequencies.includes(activityFrequencyKey);
      });
    }

    return filtered;
  }, [items, filter]);

  // 필터 변경 핸들러 (ActivityFilter에 전달)
  const handleFilterChange = (newFilter: ActivityFilterType) => {
    setFilter(newFilter);
  };

  return (
    <div>
      <ActivityFilter
        categories={categories}
        currentFilter={filter}
        onFilterChange={handleFilterChange}
      />
      <LastMoveList items={filteredItems} />
    </div>
  );
}
