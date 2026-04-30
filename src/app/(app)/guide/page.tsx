import Link from 'next/link';
import {
  Bot,
  ArrowRight,
  Globe,
  Database,
  Mail,
  Search,
  SlidersHorizontal,
  Heart,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Gavel,
  Calendar,
  TrendingDown,
  Building2,
  CheckCircle2,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────
// 서브 컴포넌트
// ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 text-lg font-bold tracking-tight">{children}</h2>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 text-sm text-muted-foreground leading-relaxed">{children}</p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 파이프라인 스텝
// ───────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    step: '01',
    title: '자동 크롤링',
    desc: '매일 오전 8시, 법원경매정보 사이트에서 조건에 맞는 아파트 경매물건을 자동 수집합니다.',
  },
  {
    icon: Database,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950',
    step: '02',
    title: 'DB 저장',
    desc: '이미 수집된 물건은 건너뛰고 신규 물건만 Supabase에 저장합니다. (중복 방지)',
  },
  {
    icon: Bot,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    step: '03',
    title: 'AI 권리분석',
    desc: 'Claude AI가 각 물건의 권리관계, 임차인 리스크, 유치권, 법정지상권 등을 자동 분석합니다.',
  },
  {
    icon: Database,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950',
    step: '04',
    title: '분석 결과 저장',
    desc: '위험도, 인수 권리, 예상 비용 등 분석 결과를 DB에 저장하여 앱에서 바로 조회 가능합니다.',
  },
  {
    icon: Mail,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950',
    step: '05',
    title: '이메일 보고서',
    desc: '신규 물건이 있으면 분석 요약 보고서를 이메일로 자동 발송합니다.',
  },
];

// ───────────────────────────────────────────────────────────
// 위험도 기준
// ───────────────────────────────────────────────────────────
const RISK_LEVELS = [
  {
    icon: ShieldCheck,
    label: '저위험',
    badge: '하',
    color: 'text-emerald-600',
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    items: [
      '말소기준권리가 명확함',
      '선순위 임차인 없음',
      '법정지상권·유치권 없음',
      '권리관계 단순 — 입찰 부담 낮음',
    ],
  },
  {
    icon: ShieldQuestion,
    label: '중위험',
    badge: '중',
    color: 'text-amber-600',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950',
    items: [
      '소액임차인 존재 가능',
      '일부 권리관계 추가 검토 필요',
      '예상치 못한 인수 금액 발생 가능성',
      '전문가 의견 참고 권장',
    ],
  },
  {
    icon: ShieldAlert,
    label: '고위험',
    badge: '상',
    color: 'text-red-600',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950',
    items: [
      '선순위 임차인 또는 유치권 존재',
      '법정지상권 문제 가능',
      '권리관계 복잡 — 인수 비용 발생',
      '전문 법률 검토 필수',
    ],
  },
];

// ───────────────────────────────────────────────────────────
// 검색 필터 안내
// ───────────────────────────────────────────────────────────
const FILTERS = [
  {
    icon: Search,
    name: '주소 검색',
    desc: '단지명, 도로명 주소, 지번 주소 키워드로 검색합니다. 2글자 이상 입력 시 자동 적용됩니다.',
  },
  {
    icon: ShieldAlert,
    name: '위험도',
    desc: 'AI가 분석한 권리관계 위험도(저위험/중위험/고위험)로 물건을 필터링합니다.',
  },
  {
    icon: Building2,
    name: '물건 종류',
    desc: '아파트, 다세대주택, 오피스텔, 단독주택, 상가, 토지 등 용도별로 분류합니다.',
  },
  {
    icon: SlidersHorizontal,
    name: '최저가 범위',
    desc: '최저매각가격 기준으로 0원~30억 범위를 슬라이더로 설정합니다. 이 금액으로 입찰에 참여할 수 있습니다.',
  },
  {
    icon: TrendingDown,
    name: '유찰횟수',
    desc: '유찰 횟수가 많을수록 최저가가 낮아집니다. 1·2·3회 이상으로 필터링하여 저가 물건을 찾을 수 있습니다.',
  },
  {
    icon: Calendar,
    name: '매각기일',
    desc: '7일·30일·3개월 이내 입찰 예정인 물건만 표시합니다. 임박한 기회를 놓치지 않도록 설정하세요.',
  },
];

// ───────────────────────────────────────────────────────────
// 주요 기능
// ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Gavel,
    title: '경매 목록',
    desc: '조건에 맞는 경매물건 전체 목록을 확인하고, 7가지 필터로 원하는 물건을 빠르게 찾습니다.',
    href: '/auction',
    cta: '경매 목록 보기',
  },
  {
    icon: Bot,
    title: 'AI 권리분석',
    desc: '물건 상세 페이지에서 Claude AI의 권리분석 결과 — 위험도, 인수권리, 임차인 현황, 예상 비용을 확인합니다.',
    href: '/auction',
    cta: '물건 선택하기',
  },
  {
    icon: Heart,
    title: '즐겨찾기',
    desc: '관심 있는 물건을 저장해두고 언제든 빠르게 재확인합니다. 입찰 전 비교 분석에 활용하세요.',
    href: '/favorites',
    cta: '즐겨찾기 보기',
  },
];

// ───────────────────────────────────────────────────────────
// AI 분석 항목
// ───────────────────────────────────────────────────────────
const ANALYSIS_ITEMS = [
  '말소기준권리 및 소멸 권리 판단',
  '선순위 임차인 존재 여부 및 보증금 분석',
  '유치권 신고 내역 검토',
  '법정지상권 성립 가능성 판단',
  '인수해야 할 권리 목록',
  '예상 취득세 + 명도비용 + 기타 비용 산출',
  '투자 관점 종합 메모',
];

// ───────────────────────────────────────────────────────────
// 페이지
// ───────────────────────────────────────────────────────────
export default function GuidePage() {
  return (
    <div className="container mx-auto max-w-2xl py-6 px-4 pb-24">

      {/* 헤더 */}
      <div className="mb-2">
        <Link href="/settings" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          설정으로
        </Link>
      </div>

      {/* 히어로 */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">REIA 서비스 안내</h1>
            <p className="text-xs text-muted-foreground">Real Estate Intelligence Assistant</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          법원경매 물건을 매일 자동 수집하고, AI가 권리관계를 분석해 투자 리스크를 한눈에 파악할 수 있도록 돕는 부동산 경매 분석 플랫폼입니다.
        </p>
      </div>

      {/* ─── 1. 자동화 파이프라인 ─── */}
      <section className="mb-8">
        <SectionTitle>자동화 데이터 파이프라인</SectionTitle>
        <SectionDesc>
          매일 오전 8시, 아래 5단계가 자동으로 실행됩니다. 사용자가 앱을 열면 항상 최신 분석 결과를 확인할 수 있습니다.
        </SectionDesc>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, idx) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', step.bg)}>
                  <step.icon className={cn('h-4 w-4', step.color)} />
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="h-4 w-px bg-border" />
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{step.step}</span>
                  <span className="text-sm font-semibold">{step.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. AI 권리분석 ─── */}
      <section className="mb-8">
        <SectionTitle>AI 권리분석이란?</SectionTitle>
        <SectionDesc>
          Claude AI가 각 경매 물건의 법원 기록을 바탕으로 아래 7가지 항목을 자동 분석합니다. 법적 지식 없이도 투자 리스크를 빠르게 파악할 수 있습니다.
        </SectionDesc>

        <Card>
          <ul className="space-y-2.5">
            {ANALYSIS_ITEMS.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            AI 분석은 참고용입니다. 실제 입찰 전에는 반드시 법원 경매 기록 원본을 확인하고 전문가 의견을 구하시기 바랍니다.
          </p>
        </div>
      </section>

      {/* ─── 3. 위험도 기준 ─── */}
      <section className="mb-8">
        <SectionTitle>위험도 기준</SectionTitle>
        <SectionDesc>
          AI가 권리관계 복잡도를 3단계로 평가합니다. 필터에서 위험도를 선택하면 원하는 수준의 물건만 볼 수 있습니다.
        </SectionDesc>

        <div className="space-y-3">
          {RISK_LEVELS.map((level) => (
            <Card key={level.badge} className={cn('border', level.border, level.bg)}>
              <div className="flex items-center gap-2 mb-2.5">
                <level.icon className={cn('h-5 w-5', level.color)} />
                <span className={cn('text-sm font-bold', level.color)}>{level.label}</span>
                <span className={cn(
                  'ml-auto rounded px-2 py-0.5 text-xs font-semibold',
                  level.badge === '하' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
                  level.badge === '중' && 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                  level.badge === '상' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                )}>
                  위험 {level.badge}
                </span>
              </div>
              <ul className="space-y-1">
                {level.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── 4. 검색 필터 안내 ─── */}
      <section className="mb-8">
        <SectionTitle>검색 필터 안내</SectionTitle>
        <SectionDesc>
          경매 목록 화면의 필터 패널(모바일에서는 필터 버튼)에서 6가지 조건을 조합해 원하는 물건을 찾을 수 있습니다.
        </SectionDesc>

        <div className="space-y-2">
          {FILTERS.map((filter) => (
            <div key={filter.name} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <filter.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{filter.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{filter.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. 주요 기능 ─── */}
      <section className="mb-8">
        <SectionTitle>주요 기능</SectionTitle>
        <SectionDesc>
          앱의 핵심 기능 세 가지입니다. 지금 바로 사용해보세요.
        </SectionDesc>

        <div className="space-y-3">
          {FEATURES.map((feat) => (
            <Card key={feat.title} className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{feat.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feat.desc}</p>
              </div>
              <Link
                href={feat.href}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 text-xs')}
              >
                {feat.cta}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── 6. 이용 팁 ─── */}
      <section className="mb-6">
        <SectionTitle>이용 팁</SectionTitle>
        <SectionDesc>처음 사용하는 분들을 위한 추천 이용 방법입니다.</SectionDesc>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          {[
            { num: '1', text: '경매 목록에서 위험도를 "저위험"으로 설정하면 상대적으로 안전한 물건만 볼 수 있습니다.' },
            { num: '2', text: '유찰횟수 2회 이상 + 매각기일 30일 이내 조합으로 저가에 임박한 물건을 찾을 수 있습니다.' },
            { num: '3', text: '물건을 클릭해 AI 권리분석의 "투자 메모" 항목을 먼저 확인하면 핵심 리스크를 빠르게 파악할 수 있습니다.' },
            { num: '4', text: '관심 있는 물건은 즐겨찾기로 저장해두고, 입찰일 전 재검토하는 습관을 만들어보세요.' },
          ].map((tip) => (
            <div key={tip.num} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                {tip.num}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">{tip.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <div className="text-center text-xs text-muted-foreground space-y-1 pt-2 border-t">
        <p>데이터 출처: 법원경매정보 (www.courtauction.go.kr)</p>
        <p>AI 분석: Anthropic Claude · 업데이트: 매일 오전 8시 KST</p>
      </div>
    </div>
  );
}
