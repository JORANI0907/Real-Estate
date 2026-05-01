import {
  CheckCircle2, AlertCircle, AlertTriangle, Info,
  Wallet, ShieldAlert, ListChecks, Lightbulb,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { PropertySolution } from '@/types/domain';

const SEVERITY_CONFIG = {
  high: { label: '높음', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
  medium: { label: '중간', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800' },
  low: { label: '낮음', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
};

interface SolutionPanelProps {
  solution: PropertySolution;
}

export function SolutionPanel({ solution }: SolutionPanelProps) {
  const cd = solution.costDetail;

  const costRows = [
    { label: '예상 낙찰가', value: cd.bidPriceEstimate },
    { label: '취득세', value: cd.acquisitionTax },
    { label: '등록면허세·교육세', value: cd.registrationFee },
    { label: '법무사 수수료', value: cd.judicialScrivener },
    { label: '인지대', value: cd.stampDuty },
    { label: '명도비용', value: cd.evictionCost },
    { label: '수리비 추정', value: cd.renovationEstimate },
    { label: '대출설정비', value: cd.loanSetupFee },
    { label: '기타', value: cd.other },
  ].filter(r => r.value > 0);

  const checklistSections = [
    { key: 'beforeBid', label: '입찰 전', items: solution.actionChecklist.beforeBid },
    { key: 'afterWinning', label: '낙찰 후', items: solution.actionChecklist.afterWinning },
    { key: 'beforeRegistration', label: '등기 전', items: solution.actionChecklist.beforeRegistration },
    { key: 'afterRegistration', label: '등기 후', items: solution.actionChecklist.afterRegistration },
  ].filter(s => s.items.length > 0);

  return (
    <div className="space-y-6 pb-4">
      {/* 요약 */}
      {solution.summary && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-sm leading-relaxed">{solution.summary}</p>
        </div>
      )}

      {/* ── 취득비용 세부내역 ── */}
      <section>
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
      </section>

      {/* ── 권리분석 문제 해결 ── */}
      {solution.rightsSolutions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold">권리분석 문제 해결방법</h3>
          </div>

          <div className="space-y-3">
            {solution.rightsSolutions.map((rs, i) => {
              const cfg = SEVERITY_CONFIG[rs.severity];
              const Icon = cfg.icon;
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
                    <div>
                      <p className="text-xs font-semibold mb-0.5">해결 방법</p>
                      <p className="text-xs text-muted-foreground">{rs.solution}</p>
                    </div>
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
        </section>
      )}

      {/* ── 체크리스트 ── */}
      {checklistSections.length > 0 && (
        <section>
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
        </section>
      )}

      {/* ── 기타 전략 ── */}
      {solution.otherSolutions && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold">추가 전략 및 유의사항</h3>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {solution.otherSolutions}
            </p>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground pt-2">
        생성일: {new Date(solution.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      </p>
    </div>
  );
}
