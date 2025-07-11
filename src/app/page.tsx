import { getItems, getCategories } from '@/lib/actions';
import { auth } from '@/lib/auth';
import GlobalNav from '@/components/GlobalNav';
import FilteredLastMoveList from '@/components/FilteredLastMoveList';
import { redirect } from 'next/navigation';

// NOTE: 동적 렌더링 강제 (데이터베이스 연결이 필요하므로)
export const dynamic = 'force-dynamic';

export default async function Home() {
  // NOTE: 페이지 레벨에서 인증 체크 (이중 보안)
  const session = await auth();
  if (!session?.user?.id) {
    console.log('[HomePage] 인증되지 않은 사용자 - /about으로 리다이렉트');
    redirect('/about');
  }

  const items = await getItems();
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="container mx-auto px-4 py-8">
        <FilteredLastMoveList items={items} categories={categories} />
      </main>
    </div>
  );
}
