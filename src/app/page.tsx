import { getItems } from "@/lib/actions";
import GlobalNav from "@/components/GlobalNav";
import LastMoveList from "@/components/LastMoveList";

// NOTE: 동적 렌더링 강제 (데이터베이스 연결이 필요하므로)
export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getItems();

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="container mx-auto px-4 py-8">
        <LastMoveList items={items} />
      </main>
    </div>
  );
}
