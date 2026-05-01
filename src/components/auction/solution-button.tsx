'use client';

import { useState } from 'react';
import { Sparkles, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { SolutionPanel } from './solution-panel';
import { toast } from 'sonner';
import type { PropertySolution } from '@/types/domain';

interface SolutionButtonProps {
  propertyId: string;
  initialSolution: PropertySolution | null;
}

export function SolutionButton({ propertyId, initialSolution }: SolutionButtonProps) {
  const [solution, setSolution] = useState<PropertySolution | null>(initialSolution);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleGenerate() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setGenerating(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/solution`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSolution(data.solution);
      setOpen(true);
      toast.success('솔루션이 생성됐습니다.');
    } catch (e) {
      toast.error('생성 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {/* 고정 하단 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 md:bottom-0 px-4 py-3 bg-background/95 backdrop-blur border-t z-40">
        <div className="container mx-auto max-w-2xl flex gap-2">
          {solution ? (
            <>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                onClick={() => setOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                솔루션 보기
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleGenerate} disabled={generating} title="솔루션 재생성">
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </>
          ) : confirming ? (
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-orange-500 mt-0.5" />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Claude AI가 이 물건의 솔루션을 분석합니다. 확인을 누르면 API 비용이 발생합니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
                  취소
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />분석 중...</>
                  ) : (
                    '확인, 생성하기'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />솔루션 분석 중...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />낙찰 받기위한 솔루션 받기</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 솔루션 Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              낙찰 솔루션
            </SheetTitle>
            <SheetDescription>
              AI가 분석한 취득비용·권리분석 해결방법·체크리스트를 확인하세요.
            </SheetDescription>
          </SheetHeader>
          {solution && <SolutionPanel solution={solution} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
