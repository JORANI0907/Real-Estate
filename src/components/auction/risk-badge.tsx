import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types/domain';

const riskConfig: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  '하': { bg: 'bg-green-100', text: 'text-green-800', label: '저위험' },
  '중': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '중위험' },
  '상': { bg: 'bg-red-100', text: 'text-red-800', label: '고위험' },
  '분석실패': { bg: 'bg-gray-100', text: 'text-gray-600', label: '분석실패' },
};

interface RiskBadgeProps {
  level: RiskLevel | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, className, size = 'sm' }: RiskBadgeProps) {
  if (!level) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500', className)}>
        미분석
      </span>
    );
  }

  const cfg = riskConfig[level];
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-base font-bold' : size === 'md' ? 'px-3 py-1 text-sm font-semibold' : 'px-2 py-0.5 text-xs font-medium';

  return (
    <span className={cn('inline-flex items-center rounded-full', sizeClass, cfg.bg, cfg.text, className)}>
      {cfg.label}
    </span>
  );
}
