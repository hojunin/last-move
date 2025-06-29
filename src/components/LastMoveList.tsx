import { LastMoveItem } from "@/lib/actions";
import LastMoveCard from "./LastMoveCard";

interface LastMoveListProps {
  items: LastMoveItem[];
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <LastMoveCard key={item.id} item={item} />
      ))}
    </div>
  );
}
