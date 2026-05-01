import { createClient } from '@/lib/supabase/server';
import { AuctionCard } from '@/components/auction/auction-card';
import { Heart } from 'lucide-react';
import type { AuctionListItem } from '@/types/domain';

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">로그인이 필요합니다</div>;
  }

  const [{ data: favs }, { data: sols }] = await Promise.all([
    supabase.from('favorites').select('property_id').eq('user_id', user.id),
    supabase.from('property_solutions').select('property_id').eq('user_id', user.id),
  ]);

  const propertyIds = (favs ?? []).map((f: { property_id: string }) => f.property_id);
  const solutionIds = new Set((sols ?? []).map((s: { property_id: string }) => s.property_id));

  let items: AuctionListItem[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from('v_auction_list')
      .select('*')
      .in('id', propertyIds);

    items = (data ?? []).map((row) => ({
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
      isFavorite: true,
      hasSolution: solutionIds.has(row.id),
    }));
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        즐겨찾기
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Heart className="h-12 w-12 mb-4 text-muted-foreground/30" />
          <p className="text-lg font-medium">즐겨찾기한 매물이 없습니다</p>
          <p className="text-sm mt-1">경매 목록에서 하트를 눌러 추가하세요</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">총 {items.length}건</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
