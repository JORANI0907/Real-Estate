import { differenceInDays, parseISO, isValid } from 'date-fns';

export function formatPrice(amount: number | null | undefined): string {
  if (!amount || amount === 0) return '-';
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.floor((amount % 100_000_000) / 10_000);
    if (man === 0) return `${eok}억`;
    return `${eok}억 ${man.toLocaleString()}만`;
  }
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000).toLocaleString()}만`;
  }
  return `${amount.toLocaleString()}원`;
}

export function formatPriceWon(amount: number | null | undefined): string {
  if (!amount || amount === 0) return '-';
  return `${amount.toLocaleString()}원`;
}

export function formatArea(m2: number | null | undefined, pyeong?: number | null): string {
  if (!m2 && !pyeong) return '-';
  if (pyeong) return `${pyeong.toFixed(1)}평`;
  if (m2) return `${m2.toFixed(1)}㎡`;
  return '-';
}

export function m2ToPyeong(m2: number): number {
  return parseFloat((m2 / 3.3058).toFixed(1));
}

export function formatBidDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    const diff = differenceInDays(date, new Date());
    if (diff < 0) return `${dateStr} (종료)`;
    if (diff === 0) return `${dateStr} (오늘)`;
    return `${dateStr} (D-${diff})`;
  } catch {
    return dateStr;
  }
}

export function getDaysUntilBid(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    return differenceInDays(date, new Date());
  } catch {
    return null;
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dateStr.split('T')[0];
}
