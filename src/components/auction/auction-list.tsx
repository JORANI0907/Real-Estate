import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AuctionCard } from './auction-card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuctionListItem } from '@/types/domain';

interface AuctionListProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function getParam(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return typeof v === 'string' ? v : '';
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function AuctionList({ searchParams }: AuctionListProps) {
  const page = parseInt(getParam(searchParams, 'page') || '1');
  const limit = 20;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let favoriteIds = new Set<string>();
  let solutionIds = new Set<string>();
  if (user) {
    const [{ data: favs }, { data: sols }] = await Promise.all([
      supabase.from('favorites').select('property_id').eq('user_id', user.id),
      supabase.from('property_solutions').select('property_id').eq('user_id', user.id),
    ]);
    favoriteIds = new Set((favs ?? []).map((f: { property_id: string }) => f.property_id));
    solutionIds = new Set((sols ?? []).map((s: { property_id: string }) => s.property_id));
  }

  let query = supabase.from('v_auction_list').select('*', { count: 'exact' });

  const riskLevel = getParam(searchParams, 'riskLevel');
  const priceMin = getParam(searchParams, 'priceMin');
  const priceMax = getParam(searchParams, 'priceMax');
  const failCountMin = getParam(searchParams, 'failCountMin');
  const propertyType = getParam(searchParams, 'propertyType');
  const bidDateFrom = getParam(searchParams, 'bidDateFrom');
  const bidDateTo = getParam(searchParams, 'bidDateTo');
  const bidDays = getParam(searchParams, 'bidDays');
  const searchKeyword = getParam(searchParams, 'searchKeyword');
  const sortBy = getParam(searchParams, 'sortBy') || 'bid_date';
  const sortOrder = getParam(searchParams, 'sortOrder') === 'desc';

  if (riskLevel) query = query.eq('risk_level', riskLevel);
  if (priceMin) query = query.gte('min_bid_amount', parseInt(priceMin));
  if (priceMax) query = query.lte('min_bid_amount', parseInt(priceMax));
  if (failCountMin) query = query.gte('fail_count', parseInt(failCountMin));
  if (propertyType) query = query.eq('property_type', propertyType);
  if (bidDateFrom) query = query.gte('bid_date', bidDateFrom);
  if (bidDays) {
    query = query.lte('bid_date', addDays(parseInt(bidDays)));
  } else if (bidDateTo) {
    query = query.lte('bid_date', bidDateTo);
  }
  if (searchKeyword) query = query.ilike('address', `%${searchKeyword}%`);

  const sortColumn =
    sortBy === 'minBidAmount' ? 'min_bid_amount' :
    sortBy === 'failCount' ? 'fail_count' :
    sortBy === 'crawledAt' ? 'crawled_at' :
    'bid_date';

  query = query.order(sortColumn, { ascending: !sortOrder });
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, count } = await query;

  const items: AuctionListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    sourceId: row.source_id ?? '',
    caseNumber: row.case_number ?? '',
    court: row.court ?? '',
    division: row.division ?? '',
    address: row.address ?? '',
    propertyType: row.property_type ?? '',
    areaPyeong: null,
    appraisalAmount: row.appraisal_amount ?? 0,
    minBidAmount: row.min_bid_amount ?? 0,
    minBidRate: row.min_bid_rate ?? 0,
    failCount: row.fail_count ?? 0,
    bidDate: row.bid_date ?? '',
    status: row.status ?? 'active',
    riskLevel: row.risk_level ?? null,
    riskSummary: row.risk_summary ?? null,
    estimatedTotalCost: row.estimated_total_cost ?? null,
    investmentMemo: row.investment_memo ?? null,
    isFavorite: favoriteIds.has(row.id),
    hasSolution: solutionIds.has(row.id),
  }));

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    sp.set('page', String(p));
    const keys = ['riskLevel', 'priceMin', 'priceMax', 'failCountMin', 'propertyType', 'bidDateFrom', 'bidDateTo', 'bidDays', 'searchKeyword', 'sortBy', 'sortOrder'];
    keys.forEach((key) => {
      const v = getParam(searchParams, key);
      if (v) sp.set(key, v);
    });
    return `/auction?${sp.toString()}`;
  };

  const totalPages = Math.ceil((count ?? 0) / limit);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">검색 결과가 없습니다</p>
        <p className="text-sm mt-1">필터 조건을 변경해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">총 {(count ?? 0).toLocaleString()}건</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AuctionCard key={item.id} item={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              <ChevronLeft className="h-4 w-4" />
              이전
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildPageUrl(page + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              다음
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
