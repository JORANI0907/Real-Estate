'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

interface AuctionFiltersProps {
  className?: string;
}

export function AuctionFilters({ className }: AuctionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const currentRisk = searchParams.get('riskLevel') ?? '';
  const currentFail = searchParams.get('failCountMin') ?? '';
  const currentKeyword = searchParams.get('searchKeyword') ?? '';
  const currentSort = `${searchParams.get('sortBy') ?? 'bidDate'}_${searchParams.get('sortOrder') ?? 'asc'}`;
  const hasFilters = currentRisk || currentFail || currentKeyword;

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

      {/* 키워드 검색 */}
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
              key={value}
              variant={currentRisk === value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParam('riskLevel', value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 유찰횟수 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">유찰횟수</p>
        <div className="flex flex-wrap gap-1.5">
          {FAIL_COUNT_OPTIONS.map(({ value, label }) => (
            <Badge
              key={value}
              variant={currentFail === value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => updateParam('failCountMin', value)}
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
