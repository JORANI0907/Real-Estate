import { Shield, Users, Wrench, Landmark } from 'lucide-react';
import { RiskBadge } from './risk-badge';
import { formatPrice } from '@/lib/format';
import type { LegalAnalysis } from '@/types/domain';

interface LegalAnalysisSectionProps {
  analysis: LegalAnalysis;
}

export function LegalAnalysisSection({ analysis }: LegalAnalysisSectionProps) {
  return (
    <div className="space-y-4">
      {/* 위험도 + 요약 */}
      <div className="flex items-start gap-3">
        <RiskBadge level={analysis.riskLevel} size="lg" />
        <p className="text-base font-semibold leading-snug">{analysis.riskSummary}</p>
      </div>

      {/* 항목별 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 말소기준권리 */}
        <div className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-blue-500" />
            말소기준권리
          </div>
          <p className="text-xs text-muted-foreground">{analysis.liquidationReferenceRight || '-'}</p>
        </div>

        {/* 임차인 위험 */}
        <div className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-orange-500" />
            임차인 위험
          </div>
          <p className="text-xs text-muted-foreground">
            {analysis.lesseeRisk.hasLessee
              ? `임차인 있음${analysis.lesseeRisk.priorityLessee ? ' (대항력)' : ''}`
              : '임차인 없음'}
          </p>
          {analysis.lesseeRisk.description && (
            <p className="text-xs text-muted-foreground">{analysis.lesseeRisk.description}</p>
          )}
        </div>

        {/* 유치권 */}
        <div className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wrench className="h-4 w-4 text-yellow-500" />
            유치권
          </div>
          <p className="text-xs text-muted-foreground">
            {analysis.lienRisk.hasLien ? '유치권 신고 있음' : '유치권 없음'}
          </p>
          {analysis.lienRisk.description && (
            <p className="text-xs text-muted-foreground">{analysis.lienRisk.description}</p>
          )}
        </div>

        {/* 법정지상권 */}
        <div className="rounded-lg border p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Landmark className="h-4 w-4 text-purple-500" />
            법정지상권
          </div>
          <p className="text-xs text-muted-foreground">
            {analysis.legalGroundRight.exists ? '성립 가능' : '해당 없음'}
          </p>
          {analysis.legalGroundRight.description && (
            <p className="text-xs text-muted-foreground">{analysis.legalGroundRight.description}</p>
          )}
        </div>
      </div>

      {/* 인수 권리 */}
      {analysis.inheritedRights.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-semibold text-destructive mb-1">인수 권리 (낙찰 후 소멸 X)</p>
          <ul className="list-disc list-inside space-y-0.5">
            {analysis.inheritedRights.map((right, i) => (
              <li key={i} className="text-xs text-muted-foreground">{right}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 예상 취득 비용 */}
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <p className="text-sm font-semibold">예상 총 취득비용</p>
        <p className="text-2xl font-bold text-primary">{formatPrice(analysis.estimatedTotalCost)}</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <span>낙찰가 추정: {formatPrice(analysis.costBreakdown.bidPriceEstimate)}</span>
          <span>취득세: {formatPrice(analysis.costBreakdown.acquisitionTax)}</span>
          <span>명도비용: {formatPrice(analysis.costBreakdown.evictionCost)}</span>
          <span>기타: {formatPrice(analysis.costBreakdown.other)}</span>
        </div>
      </div>

      {/* 투자 메모 */}
      {analysis.investmentMemo && (
        <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground">
          {analysis.investmentMemo}
        </blockquote>
      )}
    </div>
  );
}
