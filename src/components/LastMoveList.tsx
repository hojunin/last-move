import { ActivityWithLastMove } from "@/lib/actions";
import LastMoveCard from "@/components/LastMoveCard";

interface LastMoveListProps {
  items: ActivityWithLastMove[];
}

// NOTE: 카테고리별로 활동을 그룹화하는 함수
function groupItemsByCategory(items: ActivityWithLastMove[]) {
  const grouped = new Map<string, ActivityWithLastMove[]>();

  items.forEach((item) => {
    const categoryKey = item.category_name || "기타";
    if (!grouped.has(categoryKey)) {
      grouped.set(categoryKey, []);
    }
    grouped.get(categoryKey)!.push(item);
  });

  // 카테고리를 sort_order 기준으로 정렬, 기타는 마지막에
  const sortedCategories = Array.from(grouped.entries()).sort(
    ([nameA, itemsA], [nameB, itemsB]) => {
      if (nameA === "기타") return 1;
      if (nameB === "기타") return -1;

      const sortOrderA = itemsA[0]?.category_sort_order ?? 999;
      const sortOrderB = itemsB[0]?.category_sort_order ?? 999;

      return sortOrderA - sortOrderB;
    }
  );

  return sortedCategories;
}

// NOTE: 카테고리 섹션 헤더 컴포넌트
function CategoryHeader({
  name,
  icon,
  count,
}: {
  name: string;
  icon: string | null;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">{icon || "📝"}</span>
      <h2 className="text-lg font-semibold text-foreground">{name}</h2>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

export default function LastMoveList({ items }: LastMoveListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
            아직 추가된 아이템이 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            상단의 + 버튼을 눌러 첫 번째 아이템을 추가해보세요
          </p>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(items);

  return (
    <div className="space-y-8">
      {groupedItems.map(([categoryName, categoryItems]) => {
        const firstItem = categoryItems[0];
        const categoryIcon = firstItem?.category_icon;

        return (
          <section key={categoryName} className="space-y-4">
            <CategoryHeader
              name={categoryName}
              icon={categoryIcon}
              count={categoryItems.length}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryItems.map((item) => (
                <LastMoveCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
