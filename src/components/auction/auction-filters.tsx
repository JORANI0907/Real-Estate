'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const RISK_LEVELS = [
  { value: '', label: '전체' },
  { value: '하', label: '저위험' },
  { value: '중', label: '중위험' },
  { value: '상', label: '고위험' },
];

const FAIL_COUNT_OPTIONS = [
  { value: '', label: '전체' },
  { value: '1', label: '1회+' },
  { value: '2', label: '2회+' },
  { value: '3', label: '3회+' },
];

const SORT_OPTIONS = [
  { value: 'bidDate_asc', label: '매각기일 임박순' },
  { value: 'minBidAmount_asc', label: '가격 낮은순' },
  { value: 'failCount_desc', label: '유찰 많은순' },
  { value: 'crawledAt_desc', label: '최신 수집순' },
];

const PROPERTY_TYPES = [
  { value: 'ALL', label: '전체' },
  { value: '아파트', label: '아파트' },
  { value: '다세대주택', label: '다세대주택' },
  { value: '오피스텔', label: '오피스텔' },
  { value: '단독주택', label: '단독주택' },
  { value: '상가', label: '상가' },
  { value: '토지', label: '토지' },
];

const BID_DAYS_OPTIONS = [
  { value: '', label: '전체' },
  { value: '7', label: '7일 이내' },
  { value: '30', label: '30일 이내' },
  { value: '90', label: '3개월' },
];

const PRICE_MAX_EOK = 30;

function eokToWon(eok: number): number {
  return eok * 100_000_000;
}

function wonToEok(won: number): number {
  return Math.round(won / 100_000_000);
}

function formatPriceLabel(eok: number): string {
  if (eok === 0) return '0원';
  if (eok >= PRICE_MAX_EOK) return `${PRICE_MAX_EOK}억+`;
  return `${eok}억`;
}

interface AuctionFiltersProps {
  className?: string;
}

export function AuctionFilters({ className }: AuctionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlPriceMinEok = wonToEok(parseInt(searchParams.get('priceMin') || '0'));
  const urlPriceMaxEok = wonToEok(parseInt(searchParams.get('priceMax') || String(eokToWon(PRICE_MAX_EOK))));
  const [priceRange, setPriceRange] = useState([urlPriceMinEok, urlPriceMaxEok]);

  useEffect(() => {
    const min = wonToEok(parseInt(searchParams.get('priceMin') || '0'));
    const max = wonToEok(parseInt(searchParams.get('priceMax') || String(eokToWon(PRICE_MAX_EOK))));
    setPriceRange([min, max]);
  }, [searchParams]);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  function commitPriceRange(range: number[]) {
    const params = new URLSearchParams(searchParams.toString());
    const [min, max] = range;
    if (min > 0) params.set('priceMin', String(eokToWon(min)));
    else params.delete('priceMin');
    if (max < PRICE_MAX_EOK) params.set('priceMax', String(eokToWon(max)));
    else params.delete('priceMax');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentRisk = searchParams.get('riskLevel') ?? '';
  const currentFail = searchParams.get('failCountMin') ?? '';
  const currentKeyword = searchParams.get('searchKeyword') ?? '';
  const currentSort = `${searchParams.get('sortBy') ?? 'bidDate'}_${searchParams.get('sortOrder') ?? 'asc'}`;
  const currentPropertyType = searchParams.get('propertyType') || 'ALL';
  const currentBidDays = searchParams.get('bidDays') ?? '';

  const hasFilters = !!(currentRisk || currentFail || currentKeyword ||
    searchParams.get('priceMin') || searchParams.get('priceMax') ||
    (currentPropertyType !== 'ALL') || currentBidDays);

  const priceFiltered = priceRange[0] > 0 || priceRange[1] < PRICE_MAX_EOK;

  return (
    <aside className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">필터</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs">
            <X className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 주소 검색 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">주소 검색</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="주소, 단지명..."
            defaultValue={currentKeyword}
            className="pl-8 h-8 text-sm"
            onChange={(e) => {
              const v = e.target.value;
              if (v.length === 0 || v.length >= 2) updateParam('searchKeyword', v);
            }}
          />
        </div>
      </div>

      {/* 위험도 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">위험도</p>
        <div className="flex flex-wrap gap-1.5">
          {RISK_LEVELS.map(({ value, label }) => (
            <Badge
              key={value || '_all'}
              variant={currentRisk === value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParam('riskLevel', value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 물건 종류 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">물건 종류</p>
        <Select
          value={currentPropertyType}
          onValueChange={(v: string | null) => {
            const val = v === 'ALL' || !v ? '' : v;
            updateParam('propertyType', val);
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 최저가 범위 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">최저가 범위</p>
          <span className={cn('text-xs', priceFiltered ? 'text-primary font-medium' : 'text-muted-foreground')}>
            {priceFiltered
              ? `${formatPriceLabel(priceRange[0])} ~ ${formatPriceLabel(priceRange[1])}`
              : '전체'}
          </span>
        </div>
        <Slider
          min={0}
          max={PRICE_MAX_EOK}
          value={priceRange}
          onValueChange={(v) => {
            if (Array.isArray(v)) setPriceRange([v[0] as number, v[1] as number]);
          }}
          onValueCommitted={(v: number | readonly number[]) => {
            if (Array.isArray(v)) commitPriceRange([v[0] as number, v[1] as number]);
          }}
        />
      </div>

      {/* 유찰횟수 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">유찰횟수</p>
        <div className="flex flex-wrap gap-1.5">
          {FAIL_COUNT_OPTIONS.map(({ value, label }) => (
            <Badge
              key={value || '_all'}
              variant={currentFail === value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParam('failCountMin', value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 매각기일 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">매각기일</p>
        <div className="flex flex-wrap gap-1.5">
          {BID_DAYS_OPTIONS.map(({ value, label }) => (
            <Badge
              key={value || '_all'}
              variant={currentBidDays === value ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => updateParam('bidDays', value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 정렬 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">정렬</p>
        <Select
          value={currentSort}
          onValueChange={(v: string | null) => {
            if (!v) return;
            const [by, order] = v.split('_');
            const params = new URLSearchParams(searchParams.toString());
            params.set('sortBy', by);
            params.set('sortOrder', order);
            params.delete('page');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
