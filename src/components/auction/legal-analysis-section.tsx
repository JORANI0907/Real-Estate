import { Shield, Users, Wrench, Landmark, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { RiskBadge } from './risk-badge';
import { formatPrice } from '@/lib/format';
import type { LegalAnalysis } from '@/types/domain';

function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
    : <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
}

interface LegalAnalysisSectionProps {
  analysis: LegalAnalysis;
}

export function LegalAnalysisSection({ analysis }: LegalAnalysisSectionProps) {
  const noLessee = !analysis.lesseeRisk.hasLessee;
  const noPriorityLessee = !analysis.lesseeRisk.priorityLessee;
  const noLien = !analysis.lienRisk.hasLien;
  const noLegalGround = !analysis.legalGroundRight.exists;
  const noInheritedRights = analysis.inheritedRights.length === 0;

  return (
    <div className="space-y-5">

      {/* ① 종합 판정 */}
      <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
        <RiskBadge level={analysis.riskLevel} size="md" />
        <p className="text-sm font-medium leading-snug">{analysis.riskSummary}</p>
      </div>

      {/* ② 한눈에 보기 */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">한눈에 보기</p>
        <div className="rounded-xl border divide-y">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-blue-500 shrink-0" />
              말소기준권리
            </div>
            <span className="text-sm text-muted-foreground text-right line-clamp-1">
              {analysis.liquidationReferenceRight || '-'}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-orange-500 shrink-0" />
              임차인
            </div>
            <div className="flex items-center gap-1.5">
              <StatusIcon ok={noLessee || noPriorityLessee} />
              <span className="text-sm text-muted-foreground">
                {noLessee
                  ? '없음'
                  : analysis.lesseeRisk.priorityLessee
                    ? '대항력 있음'
                    : '있음 (대항력 없음)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4 text-yellow-500 shrink-0" />
              유치권
            </div>
            <div className="flex items-center gap-1.5">
              <StatusIcon ok={noLien} />
              <span className="text-sm text-muted-foreground">{noLien ? '없음' : '신고 있음'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Landmark className="h-4 w-4 text-purple-500 shrink-0" />
              법정지상권
            </div>
            <div className="flex items-center gap-1.5">
              <StatusIcon ok={noLegalGround} />
              <span className="text-sm text-muted-foreground">{noLegalGround ? '해당 없음' : '성립 가능'}</span>
            </div>
          </div>

          {!noInheritedRights && (
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                인수권리
              </div>
              <span className="text-sm text-destructive">{analysis.inheritedRights.length}건 존재</span>
            </div>
          )}
        </div>
      </div>

      {/* ③ 자세한 설명 */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">자세한 설명</p>
        <div className="space-y-3">

          {/* 말소기준권리 */}
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold">말소기준권리란?</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              낙찰 후 자동으로 사라지는 권리의 기준선입니다. 이 권리보다 나중에 등록된 근저당·가압류 등은 낙찰과 함께 모두 소멸됩니다.
            </p>
            <div className="rounded-lg bg-muted px-3 py-2 text-xs font-medium">
              {analysis.liquidationReferenceRight || '정보 없음'}
            </div>
          </div>

          {/* 임차인 — 있을 때만 */}
          {analysis.lesseeRisk.hasLessee && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold">임차인 주의사항</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.lesseeRisk.priorityLessee
                  ? '대항력 있는 임차인이 있습니다. 낙찰 후에도 임차인이 계속 거주할 권리가 있거나, 보증금을 돌려줘야 할 수 있어 추가 비용이 발생합니다.'
                  : '임차인이 있지만 대항력이 없어 낙찰 후 명도(퇴거)를 진행할 수 있습니다. 명도 협의 비용이 발생할 수 있습니다.'}
              </p>
              {analysis.lesseeRisk.description && (
                <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {analysis.lesseeRisk.description}
                </div>
              )}
            </div>
          )}

          {/* 유치권 — 있을 때만 */}
          {analysis.lienRisk.hasLien && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">유치권 신고 주의</p>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                공사 대금 등을 이유로 유치권이 신고되어 있습니다. 유치권이 인정되면 해당 금액을 추가로 부담해야 할 수 있습니다. 반드시 현장 확인 및 법률 검토가 필요합니다.
              </p>
              {analysis.lienRisk.description && (
                <p className="text-xs text-yellow-700 dark:text-yellow-500">{analysis.lienRisk.description}</p>
              )}
            </div>
          )}

          {/* 법정지상권 — 있을 때만 */}
          {analysis.legalGroundRight.exists && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">법정지상권 주의</p>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                토지와 건물의 소유자가 다를 경우 건물 소유자에게 토지 사용 권리가 생길 수 있습니다. 토지만 낙찰받으면 건물 철거가 어려울 수 있습니다.
              </p>
              {analysis.legalGroundRight.description && (
                <p className="text-xs text-purple-700 dark:text-purple-500">{analysis.legalGroundRight.description}</p>
              )}
            </div>
          )}

          {/* 인수권리 — 있을 때만 */}
          {!noInheritedRights && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-semibold text-destructive">낙찰 후에도 사라지지 않는 권리</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                아래 권리들은 낙찰받아도 자동으로 소멸되지 않습니다. 낙찰자가 그대로 떠안아야 합니다.
              </p>
              <ul className="space-y-1">
                {analysis.inheritedRights.map((right, i) => (
                  <li key={i} className="text-xs text-destructive flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ④ 예상 취득 비용 */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">예상 취득 비용</p>
        <div className="rounded-xl bg-muted p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">예상 총 비용</span>
            <span className="text-xl font-bold text-primary">{formatPrice(analysis.estimatedTotalCost)}</span>
          </div>
          <div className="border-t pt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <span>낙찰가 추정</span>
              <span className="font-medium">{formatPrice(analysis.costBreakdown.bidPriceEstimate)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>취득세</span>
              <span className="font-medium">{formatPrice(analysis.costBreakdown.acquisitionTax)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>명도비용</span>
              <span className="font-medium">{formatPrice(analysis.costBreakdown.evictionCost)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>기타</span>
              <span className="font-medium">{formatPrice(analysis.costBreakdown.other)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ⑤ AI 투자 의견 */}
      {analysis.investmentMemo && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">AI 투자 의견 및 실행 계획</p>
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm leading-relaxed">
            {analysis.investmentMemo.split(/\[(.+?)\]/).map((part, i) => {
              if (i % 2 === 1) {
                return (
                  <p key={i} className="font-semibold text-foreground mt-2 first:mt-0">
                    {part}
                  </p>
                );
              }
              if (!part.trim()) return null;
              return (
                <div key={i} className="text-muted-foreground whitespace-pre-line pl-1">
                  {part.trim()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
