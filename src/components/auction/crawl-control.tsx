'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CrawlerSettingsSheet } from './crawler-settings-sheet';

interface CrawlDate {
  crawl_date: string;
  cnt: number;
}

interface CrawlControlProps {
  crawlDates: CrawlDate[];
  autoCrawlEnabled: boolean;
}

export function CrawlControl({ crawlDates, autoCrawlEnabled: initialAutoEnabled }: CrawlControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDate = searchParams.get('crawledDate') ?? '';
  const [crawling, setCrawling] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(initialAutoEnabled);
  const [togglingAuto, setTogglingAuto] = useState(false);

  async function handleManualCrawl() {
    setCrawling(true);
    try {
      const res = await fetch('/api/crawl/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('크롤링이 시작되었습니다. 완료 후 Slack으로 알림이 옵니다.');
    } catch (e) {
      toast.error('크롤링 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setCrawling(false);
    }
  }

  async function handleAutoToggle() {
    setTogglingAuto(true);
    const newValue = !autoEnabled;
    try {
      const res = await fetch('/api/crawl/auto-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAutoEnabled(newValue);
      toast.success(
        newValue
          ? '자동 크롤링 켜짐 — 매주 토요일 오전 7시에 실행됩니다.'
          : '자동 크롤링 꺼짐'
      );
    } catch (e) {
      toast.error('설정 변경 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setTogglingAuto(false);
    }
  }

  function selectDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (date) params.set('crawledDate', date);
    else params.delete('crawledDate');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  return (
    <div className="rounded-xl border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* 날짜 필터 */}
        <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <button
            onClick={() => selectDate('')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border font-medium transition-colors',
              currentDate === ''
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-input hover:bg-muted'
            )}
          >
            전체
          </button>
          {crawlDates.map(({ crawl_date, cnt }) => (
            <button
              key={crawl_date}
              onClick={() => selectDate(crawl_date)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border font-medium transition-colors',
                currentDate === crawl_date
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-input hover:bg-muted'
              )}
            >
              {formatDate(crawl_date)}
              <span className="ml-1 opacity-60">({cnt})</span>
            </button>
          ))}
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 크롤링 설정 */}
          <CrawlerSettingsSheet />

          {/* 수동 크롤링 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleManualCrawl}
            disabled={crawling}
          >
            <RefreshCw className={cn('h-3 w-3', crawling && 'animate-spin')} />
            {crawling ? '크롤링 중…' : '지금 크롤링'}
          </Button>

          {/* 자동 크롤링 토글 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAutoToggle}
              disabled={togglingAuto}
              title={autoEnabled ? '자동 크롤링 켜짐 (매주 토요일 07시)' : '자동 크롤링 꺼짐'}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                autoEnabled ? 'bg-primary' : 'bg-input',
                togglingAuto && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                  autoEnabled ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
              {autoEnabled ? '자동 켜짐' : '자동 꺼짐'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
