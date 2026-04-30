import { Suspense } from 'react';
import { AuctionList } from '@/components/auction/auction-list';
import { AuctionFilters } from '@/components/auction/auction-filters';
import { MobileFilterSheet } from '@/components/auction/mobile-filter-sheet';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuctionPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경매 매물</h1>
        {/* 모바일 전용 필터 버튼 */}
        <div className="md:hidden">
          <Suspense>
            <MobileFilterSheet />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* PC 사이드바 필터 */}
        <Suspense>
          <AuctionFilters className="hidden md:block" />
        </Suspense>

        <Suspense fallback={<div className="py-10 text-center text-muted-foreground text-sm">불러오는 중...</div>}>
          <AuctionList searchParams={sp} />
        </Suspense>
      </div>
    </div>
  );
}
