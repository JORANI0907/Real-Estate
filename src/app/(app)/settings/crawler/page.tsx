'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── 선택지 상수 ──────────────────────────────────────────────

const COURTS = [
  { value: '', label: '전체 (법원 무관)' },
  { value: '서울중앙지방법원', label: '서울중앙지방법원' },
  { value: '서울동부지방법원', label: '서울동부지방법원' },
  { value: '서울서부지방법원', label: '서울서부지방법원' },
  { value: '서울남부지방법원', label: '서울남부지방법원' },
  { value: '서울북부지방법원', label: '서울북부지방법원' },
  { value: '수원지방법원', label: '수원지방법원' },
  { value: '수원지방법원 성남지원', label: '수원지방법원 성남지원' },
  { value: '수원지방법원 안산지원', label: '수원지방법원 안산지원' },
  { value: '수원지방법원 평택지원', label: '수원지방법원 평택지원' },
  { value: '인천지방법원', label: '인천지방법원' },
  { value: '의정부지방법원', label: '의정부지방법원' },
  { value: '춘천지방법원', label: '춘천지방법원' },
  { value: '청주지방법원', label: '청주지방법원' },
  { value: '대전지방법원', label: '대전지방법원' },
  { value: '전주지방법원', label: '전주지방법원' },
  { value: '광주지방법원', label: '광주지방법원' },
  { value: '대구지방법원', label: '대구지방법원' },
  { value: '부산지방법원', label: '부산지방법원' },
  { value: '울산지방법원', label: '울산지방법원' },
  { value: '창원지방법원', label: '창원지방법원' },
  { value: '제주지방법원', label: '제주지방법원' },
];

const SIDOS = [
  { value: '', label: '전체' },
  { value: '서울특별시', label: '서울특별시' },
  { value: '경기도', label: '경기도' },
  { value: '인천광역시', label: '인천광역시' },
  { value: '부산광역시', label: '부산광역시' },
  { value: '대구광역시', label: '대구광역시' },
  { value: '광주광역시', label: '광주광역시' },
  { value: '대전광역시', label: '대전광역시' },
  { value: '울산광역시', label: '울산광역시' },
  { value: '세종특별자치시', label: '세종특별자치시' },
  { value: '강원도', label: '강원도' },
  { value: '충청북도', label: '충청북도' },
  { value: '충청남도', label: '충청남도' },
  { value: '전라북도', label: '전라북도' },
  { value: '전라남도', label: '전라남도' },
  { value: '경상북도', label: '경상북도' },
  { value: '경상남도', label: '경상남도' },
  { value: '제주특별자치도', label: '제주특별자치도' },
];

const MAJOR_CATEGORIES = [
  { value: '건물', label: '건물' },
  { value: '토지', label: '토지' },
  { value: '차량및운송장비', label: '차량 및 운송장비' },
  { value: '기타', label: '기타' },
];

const MID_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  '건물': [
    { value: '', label: '전체' },
    { value: '주거용건물', label: '주거용건물' },
    { value: '상업용건물', label: '상업용건물' },
    { value: '공업용건물', label: '공업용건물' },
    { value: '기타건물', label: '기타건물' },
  ],
  '토지': [{ value: '', label: '전체' }],
  '차량및운송장비': [{ value: '', label: '전체' }],
  '기타': [{ value: '', label: '전체' }],
};

const MINOR_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  '주거용건물': [
    { value: '', label: '전체' },
    { value: '아파트', label: '아파트' },
    { value: '연립주택', label: '연립주택' },
    { value: '다세대주택', label: '다세대주택' },
    { value: '단독주택', label: '단독주택' },
    { value: '다가구주택', label: '다가구주택' },
    { value: '오피스텔', label: '오피스텔' },
  ],
  '상업용건물': [
    { value: '', label: '전체' },
    { value: '상가', label: '상가' },
    { value: '근린시설', label: '근린시설' },
    { value: '사무실', label: '사무실' },
  ],
  '': [{ value: '', label: '전체' }],
};

const APPRAISAL_OPTIONS = [
  { value: '', label: '전체' },
  { value: '1천만원', label: '1천만원' },
  { value: '5천만원', label: '5천만원' },
  { value: '1억원', label: '1억원' },
  { value: '2억원', label: '2억원' },
  { value: '3억원', label: '3억원' },
  { value: '5억원', label: '5억원' },
  { value: '10억원', label: '10억원' },
];

const FAIL_COUNT_OPTIONS = [
  { value: '', label: '전체 (제한 없음)' },
  { value: '1회', label: '1회 이상' },
  { value: '2회', label: '2회 이상' },
  { value: '3회', label: '3회 이상' },
  { value: '4회', label: '4회 이상' },
  { value: '5회', label: '5회 이상' },
];

// ── 타입 ────────────────────────────────────────────────────

interface CrawlerConfig {
  search_by: string;
  court: string;
  division: string;
  sido: string;
  sigungu: string;
  major_category: string;
  mid_category: string;
  minor_category: string;
  appraisal_min: string;
  appraisal_max: string;
  fail_count_min: string;
  fail_count_max: string;
  max_pages: number;
  notify_email: string;
  min_items_to_notify: number;
  updated_at?: string;
}

const DEFAULT: CrawlerConfig = {
  search_by: 'court', court: '', division: '', sido: '', sigungu: '',
  major_category: '건물', mid_category: '주거용건물', minor_category: '아파트',
  appraisal_min: '1억원', appraisal_max: '10억원',
  fail_count_min: '1회', fail_count_max: '',
  max_pages: 1, notify_email: 'sunrise@bbkorea.co.kr', min_items_to_notify: 1,
};

// ── 섹션 헤더 컴포넌트 ────────────────────────────────────────

function Section({ title, desc, children }: {
  title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm shrink-0 w-28 text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────

export default function CrawlerConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CrawlerConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/crawler-config')
      .then(r => r.json())
      .then(data => { if (!data.error) setConfig(data); })
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof CrawlerConfig>(key: K, value: CrawlerConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/crawler-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('크롤링 설정이 저장됐습니다. 다음 실행부터 적용됩니다.');
    } catch (e) {
      toast.error('저장 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  }

  const midOptions = MID_CATEGORIES[config.major_category] ?? [{ value: '', label: '전체' }];
  const minorOptions = MINOR_CATEGORIES[config.mid_category] ?? [{ value: '', label: '전체' }];

  if (loading) {
    return (
      <div className="container mx-auto max-w-lg py-6 px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          설정 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-6 px-4 pb-32">
      <div className="mb-4">
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          설정으로
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">크롤링 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          저장 후 다음 날 오전 8시 자동 실행 때 적용됩니다.
        </p>
        {config.updated_at && (
          <p className="text-xs text-muted-foreground mt-1">
            마지막 수정: {new Date(config.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </p>
        )}
      </div>

      <div className="space-y-3">

        {/* ── 지역 조건 ── */}
        <Section title="지역 조건" desc="법원 기준 또는 소재지(시도) 기준으로 검색합니다.">
          <Row label="검색 기준">
            <div className="flex gap-2">
              {[
                { value: 'court', label: '법원 기준' },
                { value: 'address', label: '소재지 기준' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('search_by', opt.value)}
                  className={cn(
                    'flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors',
                    config.search_by === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Row>

          {config.search_by === 'court' ? (
            <Row label="법원 선택">
              <Select value={config.court || '__all'} onValueChange={(v: string | null) => set('court', (v ?? '') === '__all' ? '' : (v ?? ''))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURTS.map(c => (
                    <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          ) : (
            <Row label="시도 선택">
              <Select value={config.sido || '__all'} onValueChange={(v: string | null) => set('sido', (v ?? '') === '__all' ? '' : (v ?? ''))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIDOS.map(s => (
                    <SelectItem key={s.value || '__all'} value={s.value || '__all'}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )}
        </Section>

        {/* ── 물건 종류 ── */}
        <Section title="물건 종류">
          <Row label="대분류">
            <Select value={config.major_category} onValueChange={(v: string | null) => {
              if (!v) return;
              set('major_category', v);
              set('mid_category', '');
              set('minor_category', '');
            }}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAJOR_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {midOptions.length > 1 && (
            <Row label="중분류">
              <Select value={config.mid_category || '__all'} onValueChange={(v: string | null) => {
                set('mid_category', (v ?? '') === '__all' ? '' : (v ?? ''));
                set('minor_category', '');
              }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {midOptions.map(c => (
                    <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )}

          {minorOptions.length > 1 && (
            <Row label="소분류">
              <Select value={config.minor_category || '__all'} onValueChange={(v: string | null) => set('minor_category', (v ?? '') === '__all' ? '' : (v ?? ''))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {minorOptions.map(c => (
                    <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )}
        </Section>

        {/* ── 가격 조건 ── */}
        <Section title="감정평가액 범위">
          <Row label="최소">
            <Select value={config.appraisal_min || '__all'} onValueChange={(v: string | null) => set('appraisal_min', (v ?? '') === '__all' ? '' : (v ?? ''))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {APPRAISAL_OPTIONS.map(o => (
                  <SelectItem key={o.value || '__all'} value={o.value || '__all'}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="최대">
            <Select value={config.appraisal_max || '__all'} onValueChange={(v: string | null) => set('appraisal_max', (v ?? '') === '__all' ? '' : (v ?? ''))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {APPRAISAL_OPTIONS.map(o => (
                  <SelectItem key={o.value || '__all'} value={o.value || '__all'}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Section>

        {/* ── 유찰 조건 ── */}
        <Section title="유찰 조건" desc="최소 유찰 횟수 이상인 물건만 수집합니다.">
          <Row label="최소 유찰횟수">
            <Select value={config.fail_count_min || '__all'} onValueChange={(v: string | null) => set('fail_count_min', (v ?? '') === '__all' ? '' : (v ?? ''))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FAIL_COUNT_OPTIONS.map(o => (
                  <SelectItem key={o.value || '__all'} value={o.value || '__all'}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Section>

        {/* ── 수집 범위 ── */}
        <Section title="수집 범위" desc="페이지당 10건 수집. 최대 5페이지(50건)까지 설정 가능합니다.">
          <Row label="최대 페이지">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={config.max_pages}
                onChange={e => set('max_pages', parseInt(e.target.value))}
                className="flex-1 h-2 accent-primary cursor-pointer"
              />
              <span className="text-sm font-semibold w-12 text-center">
                {config.max_pages}페이지<br />
                <span className="text-xs font-normal text-muted-foreground">({config.max_pages * 10}건)</span>
              </span>
            </div>
          </Row>
        </Section>

        {/* ── 이메일 알림 ── */}
        <Section title="이메일 알림" desc="신규 물건 발생 시 보고서를 발송합니다.">
          <Row label="수신 이메일">
            <Input
              value={config.notify_email}
              onChange={e => set('notify_email', e.target.value)}
              type="email"
              className="h-8 text-sm"
              placeholder="example@email.com"
            />
          </Row>
          <Row label="최소 발송 건수">
            <div className="flex items-center gap-2">
              <Input
                value={config.min_items_to_notify}
                onChange={e => set('min_items_to_notify', Math.max(1, parseInt(e.target.value) || 1))}
                type="number"
                min={1}
                className="h-8 text-sm w-20"
              />
              <span className="text-sm text-muted-foreground">건 이상일 때 발송</span>
            </div>
          </Row>
        </Section>

      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 md:bottom-0 px-4 py-3 bg-background/95 backdrop-blur border-t">
        <div className="container mx-auto max-w-lg">
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />저장 중...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />설정 저장</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
