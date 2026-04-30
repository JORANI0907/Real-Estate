import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { RiskBadge } from '@/components/auction/risk-badge';
import { LegalAnalysisSection } from '@/components/auction/legal-analysis-section';
import { FavoriteButton } from '@/components/common/favorite-button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice, formatBidDate, formatDate } from '@/lib/format';
import type { Property, LegalAnalysis } from '@/types/domain';

interface PageProps {
  params: Promise<{ id: string }>;
}

function mapProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    source: row.source as 'auction',
    sourceId: row.source_id as string,
    externalUrl: row.external_url as string | null,
    title: row.title as string | null,
    propertyType: row.property_type as string | null,
    address: row.address as string | null,
    addressRoad: row.address_road as string | null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    areaM2: row.area_m2 as number | null,
    areaPyeong: row.area_pyeong as number | null,
    floor: row.floor as number | null,
    totalFloors: row.total_floors as number | null,
    builtYear: row.built_year as number | null,
    priceMain: row.price_main as number | null,
    priceDeposit: row.price_deposit as number | null,
    priceMonthly: row.price_monthly as number | null,
    priceMinBid: row.price_min_bid as number | null,
    minBidRate: row.min_bid_rate as number | null,
    caseNumber: row.case_number as string | null,
    court: row.court as string | null,
    division: row.division as string | null,
    failCount: (row.fail_count as number) ?? 0,
    bidDate: row.bid_date as string | null,
    claimAmount: row.claim_amount as number | null,
    itemNote: row.item_note as string | null,
    parties: (row.parties as Record<string, string[]>) ?? {},
    appraisalSummary: row.appraisal_summary as string | null,
    status: (row.status as 'active') ?? 'active',
    crawledAt: row.crawled_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLegalAnalysis(row: Record<string, unknown>): LegalAnalysis {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    riskLevel: row.risk_level as LegalAnalysis['riskLevel'],
    riskSummary: (row.risk_summary as string) ?? '',
    liquidationReferenceRight: (row.liquidation_reference_right as string) ?? '',
    inheritedRights: (row.inherited_rights as string[]) ?? [],
    lesseeRisk: (row.lessee_risk as LegalAnalysis['lesseeRisk']) ?? { hasLessee: false, priorityLessee: false, description: '' },
    lienRisk: (row.lien_risk as LegalAnalysis['lienRisk']) ?? { hasLien: false, description: '' },
    legalGroundRight: (row.legal_ground_right as LegalAnalysis['legalGroundRight']) ?? { exists: false, description: '' },
    estimatedTotalCost: (row.estimated_total_cost as number) ?? 0,
    costBreakdown: (row.cost_breakdown as LegalAnalysis['costBreakdown']) ?? { bidPriceEstimate: 0, acquisitionTax: 0, evictionCost: 0, other: 0 },
    investmentMemo: (row.investment_memo as string) ?? '',
    rawAnalysis: (row.raw_analysis as string) ?? '',
    analyzedAt: row.analyzed_at as string,
  };
}

export default async function AuctionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: raw, error } = await supabase
    .from('properties')
    .select('*, legal_analysis(*)')
    .eq('id', id)
    .single();

  if (error || !raw) notFound();

  const property = mapProperty(raw as Record<string, unknown>);
  const legalRaw = Array.isArray(raw.legal_analysis)
    ? raw.legal_analysis[0]
    : raw.legal_analysis;
  const legalAnalysis = legalRaw ? mapLegalAnalysis(legalRaw as Record<string, unknown>) : null;

  let isFavorite = false;
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('property_id', id)
      .eq('user_id', user.id)
      .single();
    isFavorite = !!fav;
  }

  return (
    <div className="container mx-auto max-w-2xl py-6 px-4">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <Link href="/auction" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-mono">{property.caseNumber}</p>
          <h1 className="text-xl font-bold leading-snug">{property.address}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{property.court}</span>
            {property.division && <><span>·</span><span>{property.division}</span></>}
            {property.propertyType && <><span>·</span><span>{property.propertyType}</span></>}
          </div>
        </div>
        <FavoriteButton propertyId={id} initialState={isFavorite} className="shrink-0" />
      </div>

      {/* 가격 카드 */}
      <div className="rounded-xl border bg-card p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">감정평가액</p>
            <p className="text-lg font-semibold">{formatPrice(property.priceMain)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">최저매각가격</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-primary">{formatPrice(property.priceMinBid)}</p>
              {property.minBidRate && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  {property.minBidRate}%
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">매각기일</p>
            <p className="text-sm font-medium">{formatBidDate(property.bidDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">유찰횟수</p>
            <p className="text-sm font-medium">{property.failCount}회</p>
          </div>
        </div>
        {property.claimAmount && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">청구금액</p>
            <p className="text-sm">{formatPrice(property.claimAmount)}</p>
          </div>
        )}
      </div>

      {/* 권리분석 */}
      {legalAnalysis ? (
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3">권리분석</h2>
          <LegalAnalysisSection analysis={legalAnalysis} />
        </section>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground mb-6">
          <p className="text-sm">권리분석 데이터가 없습니다</p>
          <p className="text-xs mt-1">크롤러 실행 시 자동으로 분석됩니다</p>
        </div>
      )}

      {/* 물건비고 */}
      {property.itemNote && (
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3">물건비고</h2>
          <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{property.itemNote}</p>
        </section>
      )}

      {/* 당사자 정보 */}
      {Object.keys(property.parties).length > 0 && (
        <details className="mb-6 group">
          <summary className="flex cursor-pointer items-center justify-between rounded-lg border p-3 font-medium text-sm">
            당사자 정보
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-2 rounded-lg border p-3">
            {Object.entries(property.parties).map(([type, names]) => (
              <div key={type} className="flex gap-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground">{type}</span>
                <span>{Array.isArray(names) ? names.join(', ') : names}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 감정평가요항 */}
      {property.appraisalSummary && (
        <details className="mb-6 group">
          <summary className="flex cursor-pointer items-center justify-between rounded-lg border p-3 font-medium text-sm">
            감정평가요항
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 rounded-lg border p-3">
            <p className="text-xs whitespace-pre-wrap text-muted-foreground">{property.appraisalSummary}</p>
          </div>
        </details>
      )}

      {/* 수집 정보 */}
      <p className="text-xs text-muted-foreground text-center mb-6">
        수집일: {formatDate(property.crawledAt)}
      </p>

      {/* 원본 링크 */}
      <a
        href="https://www.courtauction.go.kr"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        법원경매정보 원본 보기
      </a>
    </div>
  );
}
