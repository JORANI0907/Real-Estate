import { Suspense } from 'react';
import { AuctionList } from '@/components/auction/auction-list';
import { AuctionFilters } from '@/components/auction/auction-filters';
import { MobileFilterSheet } from '@/components/auction/mobile-filter-sheet';
import { CrawlControl } from '@/components/auction/crawl-control';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuctionPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const supabase = await createClient();

  const [{ data: crawlDates }, { data: config }] = await Promise.all([
    supabase.from('v_crawl_dates').select('crawl_date, cnt').limit(14),
    supabase.from('crawler_config').select('auto_crawl_enabled').eq('id', 1).single(),
  ]);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경매 매물</h1>
        <div className="md:hidden">
          <Suspense>
            <MobileFilterSheet />
          </Suspense>
        </div>
      </div>

      {/* 크롤링 컨트롤 — 날짜 필터 + 수동/자동 버튼 */}
      <div className="mb-4">
        <Suspense>
          <CrawlControl
            crawlDates={crawlDates ?? []}
            autoCrawlEnabled={config?.auto_crawl_enabled ?? false}
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
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
