import Link from 'next/link';
import { Calendar, RotateCcw } from 'lucide-react';
import { RiskBadge } from './risk-badge';
import { FavoriteButton } from '@/components/common/favorite-button';
import { formatPrice, formatBidDate, getDaysUntilBid } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AuctionListItem } from '@/types/domain';

interface AuctionCardProps {
  item: AuctionListItem;
  className?: string;
}

export function AuctionCard({ item, className }: AuctionCardProps) {
  const daysUntil = getDaysUntilBid(item.bidDate);
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;

  return (
    <Link href={`/auction/${item.id}`}>
      <div className={cn(
        'relative rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50',
        className
      )}>
        {/* 즐겨찾기 */}
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={item.id} initialState={item.isFavorite} />
        </div>

        {/* 상단: 위험도 + 사건번호 */}
        <div className="flex items-center gap-2 pr-10">
          <RiskBadge level={item.riskLevel} />
          <span className="text-xs text-muted-foreground font-mono">
            {item.caseNumber}
          </span>
          <span className="text-xs text-muted-foreground">{item.court}</span>
        </div>

        {/* 주소 */}
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">
          {item.address || '주소 정보 없음'}
        </p>

        {/* 물건 종류 */}
        {item.propertyType && (
          <span className="mt-1 inline-block text-xs text-muted-foreground">{item.propertyType}</span>
        )}

        {/* 가격 정보 */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">감정가</span>
            <span>{formatPrice(item.appraisalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">최저가</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-primary">{formatPrice(item.minBidAmount)}</span>
              <span className="rounded bg-primary/10 px-1 text-xs font-medium text-primary">
                {item.minBidRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 하단: 매각기일 + 유찰 */}
        <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className={cn('h-3 w-3', isUrgent && 'text-destructive')} />
            <span className={cn(isUrgent && 'font-semibold text-destructive')}>
              {formatBidDate(item.bidDate)}
            </span>
          </div>
          {item.failCount > 0 && (
            <div className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              <span>{item.failCount}회 유찰</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
