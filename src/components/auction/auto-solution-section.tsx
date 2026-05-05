import {
  MapPin, Building2, ShieldAlert, Wallet,
  ListChecks, Lightbulb, CheckCircle2,
  AlertCircle, AlertTriangle, Info,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { AutoSolution } from '@/types/domain';

const SEVERITY_CONFIG = {
  high: {
    label: '높음',
    Icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/30',
  },
  medium: {
    label: '중간',
    Icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
  },
  low: {
    label: '낮음',
    Icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  },
};

interface AutoSolutionSectionProps {
  solution: AutoSolution;
}

export function AutoSolutionSection({ solution }: AutoSolutionSectionProps) {
  const cd = solution.costDetail;

  const costRows = [
    { label: '예상 낙찰가', value: cd.bidPriceEstimate },
    { label: '취득세', value: cd.acquisitionTax },
    { label: '등록면허세·교육세', value: cd.registrationFee },
    { label: '법무사 수수료', value: cd.judicialScrivener },
    { label: '명도비용', value: cd.evictionCost },
    { label: '수리비 추정', value: cd.renovationEstimate },
    { label: '기타', value: cd.other },
  ].filter(r => r.value > 0);

  const checklistSections = [
    { key: 'beforeBid', label: '입찰 전', items: solution.actionChecklist.beforeBid },
    { key: 'afterWinning', label: '낙찰 후', items: solution.actionChecklist.afterWinning },
    { key: 'beforeRegistration', label: '등기 전', items: solution.actionChecklist.beforeRegistration },
    { key: 'afterRegistration', label: '등기 후', items: solution.actionChecklist.afterRegistration },
  ].filter(s => s.items.length > 0);

  return (
    <div className="space-y-5">

      {/* ① 위치 분석 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-bold">위치 분석</h3>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {solution.locationAnalysis.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {solution.locationAnalysis.summary}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {solution.locationAnalysis.pros.length > 0 && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">장점</p>
                </div>
                <ul className="space-y-1">
                  {solution.locationAnalysis.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-green-700 dark:text-green-300 flex gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {solution.locationAnalysis.cons.length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">단점</p>
                </div>
                <ul className="space-y-1">
                  {solution.locationAnalysis.cons.map((con, i) => (
                    <li key={i} className="text-xs text-red-700 dark:text-red-300 flex gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ② 물건 특수성 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold">물건 특수성 분석</h3>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          {solution.propertyCharacteristics.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {solution.propertyCharacteristics.summary}
            </p>
          )}
          {solution.propertyCharacteristics.points.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {solution.propertyCharacteristics.points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ③ 권리별 해결방법 */}
      {solution.rightsSolutions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold">권리별 해결방법</h3>
          </div>
          <div className="space-y-3">
            {solution.rightsSolutions.map((rs, i) => {
              const cfg = SEVERITY_CONFIG[rs.severity] ?? SEVERITY_CONFIG.low;
              const { Icon } = cfg;
              return (
                <div key={i} className={`rounded-xl border p-4 space-y-2.5 ${cfg.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <span className="text-sm font-semibold">{rs.issue}</span>
                    <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      위험 {cfg.label}
                    </span>
                  </div>
                  {rs.description && (
                    <p className="text-xs text-muted-foreground pl-6">{rs.description}</p>
                  )}
                  <div className="pl-6 space-y-1.5">
                    {rs.solution && (
                      <div>
                        <p className="text-xs font-semibold mb-0.5">해결 방법</p>
                        <p className="text-xs text-muted-foreground">{rs.solution}</p>
                      </div>
                    )}
                    {rs.myAction && (
                      <div>
                        <p className="text-xs font-semibold mb-0.5">내가 할 일</p>
                        <p className="text-xs text-muted-foreground">{rs.myAction}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ④ 예상 취득비용 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">예상 취득비용 세부내역</h3>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {costRows.map(r => (
              <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium tabular-nums">{formatPrice(r.value)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-4 py-3 bg-primary/5 border-t">
            <span className="text-sm font-bold">총 예상 취득비용</span>
            <span className="text-base font-bold text-primary tabular-nums">
              {formatPrice(cd.total)}
            </span>
          </div>
          {cd.notes && (
            <div className="px-4 py-2.5 border-t">
              <p className="text-xs text-muted-foreground">{cd.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ⑤ 단계별 체크리스트 */}
      {checklistSections.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-bold">단계별 체크리스트</h3>
          </div>
          <div className="space-y-3">
            {checklistSections.map(sec => (
              <div key={sec.key} className="rounded-xl border bg-card p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  {sec.label}
                </p>
                <ul className="space-y-1.5">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⑥ 투자 종합 의견 */}
      {solution.investmentOpinion && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold">투자 종합 의견</h3>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {solution.investmentOpinion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
