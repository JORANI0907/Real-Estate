'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AuctionFilters } from './auction-filters';
import { cn } from '@/lib/utils';

const FILTER_KEYS = ['riskLevel', 'priceMin', 'priceMax', 'failCountMin', 'propertyType', 'bidDays', 'searchKeyword'];

export function MobileFilterSheet() {
  const searchParams = useSearchParams();
  const activeCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length;

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          'relative inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          activeCount > 0 ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        필터
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-0">
        <SheetHeader className="px-5 pb-2">
          <SheetTitle className="text-base">필터</SheetTitle>
        </SheetHeader>
        <AuctionFilters className="px-5 pb-10" />
      </SheetContent>
    </Sheet>
  );
}
