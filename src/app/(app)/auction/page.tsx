import { Suspense } from 'react';
import { AuctionList } from '@/components/auction/auction-list';
import { AuctionFilters } from '@/components/auction/auction-filters';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuctionPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">경매 매물</h1>

      {/* PC: 좌측 필터 + 우측 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <Suspense>
          <AuctionFilters className="hidden md:block" />
        </Suspense>

        {/* 모바일 필터 (가로 스크롤) */}
        <div className="md:hidden overflow-x-auto">
          <Suspense>
            <AuctionFilters />
          </Suspense>
        </div>

        <Suspense fallback={<div className="py-10 text-center text-muted-foreground">불러오는 중...</div>}>
          <AuctionList searchParams={sp} />
        </Suspense>
      </div>
    </div>
  );
}
