# Phase 1 상세 명세서 — 경매 트랙 통합

> 작성일: 2026-04-30
> 작성: Opus 4.7 (계획)
> 구현: Sonnet 4.6 (이 문서 받아서 그대로 코딩)
> 기간: 2주 예상
> 대상 TASK: TASK-001 ~ TASK-010

---

## 0. Phase 1의 목표

**완료 정의 (Definition of Done)**:
1. 새 Next.js 14 앱(`reia`)이 Vercel에 배포되어 있음
2. 가족 구성원이 이메일로 회원가입/로그인 가능
3. 매일 오전 8시 기존 auction-crawler가 새 `properties` 테이블에 데이터 적재
4. 사용자가 앱에서 경매 매물 목록·필터·정렬 가능
5. 매물 클릭 시 권리분석 + 가격 정보 표시
6. 즐겨찾기 추가/제거/조회 가능
7. PC와 모바일 모두에서 사용 가능 (반응형)

**완료 안 된 것 (Phase 2 이상)**:
- 수익성 시뮬레이션 (Phase 2)
- 매매/전월세 검색 (Phase 3)
- 공간대여 (Phase 4)
- 알림/PWA (Phase 5)

---

## 1. 전제 조건 (사용자 준비 사항)

### 1-1. Supabase 신규 프로젝트 생성
1. https://supabase.com/dashboard 접속
2. "New Project" 클릭
3. 프로젝트명: `reia` 또는 `real-estate-app`
4. 비밀번호: 안전한 비밀번호 설정 (분실 방지)
5. Region: `Northeast Asia (Seoul)` 권장
6. 생성 완료 후 다음 정보 확보:
   - `Project URL`: Settings → API → Project URL
   - `anon (public) key`: Settings → API → anon public
   - `service_role key`: Settings → API → service_role (비공개!)

### 1-2. GitHub 신규 저장소 생성
1. https://github.com/new
2. Repository name: `reia` 또는 원하는 이름
3. Private 권장
4. 빈 저장소로 생성 (README, .gitignore 자동 생성 X)

### 1-3. Vercel 계정 연동
1. Vercel에 GitHub 저장소 연결 (자동 배포)
2. Environment Variables 등록 (TASK-001 단계에서 구체화)

### 1-4. 환경변수 (`.env.local`에 저장)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...           # 서버 전용 (절대 클라이언트 노출 금지)

# Claude (auction-crawler 재활용)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Gmail (auction-crawler 재활용)
GMAIL_USER=sunrise@bbkorea.co.kr
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Slack (실패 알림)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

---

## 2. 폴더 구조 (확정)

```
real-estate-app/
├── PROJECT-PLAN.md              # 전체 기획서
├── PHASE-1-SPEC.md              # 본 문서
├── README.md                    # 셋업 가이드
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.local                   # git 제외
├── .env.example
├── .gitignore
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # 루트 레이아웃 (인증 컨텍스트, 폰트)
│   │   ├── page.tsx             # 홈 (대시보드)
│   │   ├── globals.css          # Tailwind + Pretendard
│   │   │
│   │   ├── (auth)/              # 비로그인 라우트 그룹
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── (app)/               # 로그인 필요 라우트 그룹
│   │   │   ├── layout.tsx       # 헤더/하단탭 포함
│   │   │   ├── auction/
│   │   │   │   ├── page.tsx     # 경매 목록
│   │   │   │   └── [id]/page.tsx # 경매 상세
│   │   │   └── favorites/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── callback/route.ts  # 매직링크 콜백
│   │       ├── properties/
│   │       │   ├── route.ts           # GET 목록
│   │       │   └── [id]/route.ts      # GET 단건
│   │       └── favorites/
│   │           ├── route.ts           # POST 추가, GET 목록
│   │           └── [propertyId]/route.ts # DELETE
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── slider.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── bottom-nav.tsx   # 모바일 하단 탭
│   │   │   └── side-nav.tsx     # PC 사이드바
│   │   ├── auction/
│   │   │   ├── auction-card.tsx
│   │   │   ├── auction-filters.tsx
│   │   │   ├── auction-list.tsx
│   │   │   ├── auction-detail.tsx
│   │   │   ├── risk-badge.tsx
│   │   │   └── legal-analysis-section.tsx
│   │   └── common/
│   │       ├── price-display.tsx       # 1.7억 / 17,000,000원 포맷
│   │       ├── empty-state.tsx
│   │       └── favorite-button.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # 브라우저 클라이언트
│   │   │   ├── server.ts        # 서버 컴포넌트 클라이언트
│   │   │   └── service.ts       # service_role 클라이언트 (관리용)
│   │   ├── format.ts            # 가격/날짜/평수 포맷
│   │   ├── auth.ts              # 인증 헬퍼 (현재 사용자 가져오기)
│   │   └── utils.ts             # cn() 등
│   │
│   └── types/
│       ├── database.ts          # Supabase 자동생성 타입
│       └── domain.ts            # 도메인 타입 (Property, AuctionDetail 등)
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_migrate_auction_data.sql
│   └── seed.sql                 # 개발용 시드 데이터 (선택)
│
├── worker/                      # 데이터 수집 워커 (auction-crawler 이전)
│   ├── package.json
│   ├── src/
│   │   ├── index.js             # 진입점
│   │   ├── config.js            # 검색조건
│   │   ├── crawler.js           # Playwright (기존 코드 그대로)
│   │   ├── analyzer.js          # Claude 분석 (기존 코드 그대로)
│   │   ├── db.js                # Supabase 클라이언트 (새 테이블 맞춤)
│   │   └── reporter.js          # 이메일 (Phase 5에서 활용)
│   └── .env.example
│
└── .github/
    └── workflows/
        ├── daily-crawl.yml      # 매일 8시 KST 워커 실행
        └── deploy.yml           # Vercel 자동배포 (선택)
```

---

## 3. 데이터 모델 (DB 스키마)

### 3-1. SQL 마이그레이션 — `supabase/migrations/0001_initial_schema.sql`

```sql
-- 1) 통합 매물 테이블
CREATE TABLE properties (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source             text NOT NULL CHECK (source IN ('auction','sale','rent','lease','space')),
  source_id          text NOT NULL,
  external_url       text,

  title              text,
  property_type      text,
  address            text,
  address_road       text,
  latitude           numeric(10, 7),
  longitude          numeric(10, 7),
  area_m2            numeric(10, 2),
  area_pyeong        numeric(10, 2),
  floor              int,
  total_floors       int,
  built_year         int,

  price_main         bigint,
  price_deposit      bigint,
  price_monthly      bigint,
  price_min_bid      bigint,
  min_bid_rate       int,

  -- 경매 전용 필드 (다른 트랙은 NULL)
  case_number        text,
  court              text,
  division           text,
  fail_count         int DEFAULT 0,
  bid_date           date,
  claim_amount       bigint,
  item_note          text,
  parties            jsonb DEFAULT '{}'::jsonb,
  appraisal_summary  text,

  raw_data           jsonb DEFAULT '{}'::jsonb,
  status             text DEFAULT 'active' CHECK (status IN ('active','closed','withdrawn')),
  crawled_at         timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),

  UNIQUE(source, source_id)
);

CREATE INDEX idx_properties_source ON properties(source);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_geo ON properties(latitude, longitude);
CREATE INDEX idx_properties_bid_date ON properties(bid_date);
CREATE INDEX idx_properties_case_number ON properties(case_number);
CREATE INDEX idx_properties_min_bid_rate ON properties(min_bid_rate);
CREATE INDEX idx_properties_status ON properties(status);

-- 2) 권리분석
CREATE TABLE legal_analysis (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        uuid UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  risk_level         text CHECK (risk_level IN ('상','중','하','분석실패')),
  risk_summary       text,
  liquidation_reference_right text,
  inherited_rights   jsonb DEFAULT '[]'::jsonb,
  lessee_risk        jsonb DEFAULT '{}'::jsonb,
  lien_risk          jsonb DEFAULT '{}'::jsonb,
  legal_ground_right jsonb DEFAULT '{}'::jsonb,
  estimated_total_cost bigint DEFAULT 0,
  cost_breakdown     jsonb DEFAULT '{}'::jsonb,
  investment_memo    text,
  raw_analysis       text,
  analyzed_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_legal_analysis_risk_level ON legal_analysis(risk_level);

-- 3) 즐겨찾기
CREATE TABLE favorites (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  note        text,
  folder      text DEFAULT 'default',
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- 4) 통합 뷰 (목록 조회용)
CREATE OR REPLACE VIEW v_auction_list AS
SELECT
  p.id,
  p.source_id,
  p.case_number,
  p.court,
  p.division,
  p.address,
  p.property_type,
  p.area_m2,
  p.area_pyeong,
  p.price_main      AS appraisal_amount,
  p.price_min_bid   AS min_bid_amount,
  p.min_bid_rate,
  p.fail_count,
  p.bid_date,
  p.status,
  l.risk_level,
  l.risk_summary,
  l.estimated_total_cost,
  l.investment_memo,
  p.crawled_at
FROM properties p
LEFT JOIN legal_analysis l ON p.id = l.property_id
WHERE p.source = 'auction';

-- 5) updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
```

### 3-2. RLS 정책 — `0002_rls_policies.sql`

```sql
-- properties는 로그인 사용자 모두 읽기 가능, 쓰기는 service_role만
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_read_all_authenticated"
ON properties FOR SELECT
TO authenticated
USING (true);

-- (INSERT/UPDATE/DELETE는 service_role만 자동 허용 — RLS 우회)

-- legal_analysis 동일
ALTER TABLE legal_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_analysis_read_all_authenticated"
ON legal_analysis FOR SELECT
TO authenticated
USING (true);

-- favorites는 본인 것만 접근 가능
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_update_own"
ON favorites FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### 3-3. 기존 데이터 이전 — `0003_migrate_auction_data.sql`

```sql
-- BBK Supabase 프로젝트의 auction_items/auction_analysis가 있다면
-- 별도 export → CSV → import 또는 SQL 직접 실행
-- (가족 사용 + 신규 시작이므로 데이터 이전 생략 가능, 새로 크롤링하는 것이 깔끔)
```

→ **결정**: 데이터 이전 생략. Phase 1에서 워커가 새 DB로 다시 수집.

---

## 4. TypeScript 도메인 타입 — `src/types/domain.ts`

```typescript
export type Source = 'auction' | 'sale' | 'rent' | 'lease' | 'space';
export type RiskLevel = '상' | '중' | '하' | '분석실패';
export type PropertyStatus = 'active' | 'closed' | 'withdrawn';

export interface Property {
  id: string;
  source: Source;
  sourceId: string;
  externalUrl: string | null;

  title: string | null;
  propertyType: string | null;
  address: string | null;
  addressRoad: string | null;
  latitude: number | null;
  longitude: number | null;
  areaM2: number | null;
  areaPyeong: number | null;
  floor: number | null;
  totalFloors: number | null;
  builtYear: number | null;

  priceMain: number | null;
  priceDeposit: number | null;
  priceMonthly: number | null;
  priceMinBid: number | null;
  minBidRate: number | null;

  caseNumber: string | null;
  court: string | null;
  division: string | null;
  failCount: number;
  bidDate: string | null;
  claimAmount: number | null;
  itemNote: string | null;
  parties: Record<string, string[]>;
  appraisalSummary: string | null;

  status: PropertyStatus;
  crawledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalAnalysis {
  id: string;
  propertyId: string;
  riskLevel: RiskLevel;
  riskSummary: string;
  liquidationReferenceRight: string;
  inheritedRights: string[];
  lesseeRisk: {
    hasLessee: boolean;
    priorityLessee: boolean;
    description: string;
  };
  lienRisk: {
    hasLien: boolean;
    description: string;
  };
  legalGroundRight: {
    exists: boolean;
    description: string;
  };
  estimatedTotalCost: number;
  costBreakdown: {
    bidPriceEstimate: number;
    acquisitionTax: number;
    evictionCost: number;
    other: number;
  };
  investmentMemo: string;
  analyzedAt: string;
}

export interface AuctionListItem {
  id: string;
  caseNumber: string;
  court: string;
  division: string;
  address: string;
  propertyType: string;
  areaPyeong: number | null;
  appraisalAmount: number;
  minBidAmount: number;
  minBidRate: number;
  failCount: number;
  bidDate: string;
  status: PropertyStatus;
  riskLevel: RiskLevel | null;
  riskSummary: string | null;
  estimatedTotalCost: number | null;
  investmentMemo: string | null;
  isFavorite: boolean;
}

export interface AuctionListFilters {
  riskLevel?: RiskLevel;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  failCountMin?: number;
  bidDateFrom?: string;
  bidDateTo?: string;
  searchKeyword?: string;
  sortBy?: 'bidDate' | 'minBidAmount' | 'failCount' | 'crawledAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

---

## 5. API 라우트 명세

### 5-1. `GET /api/properties?source=auction&...`

**Query Parameters**: `AuctionListFilters` 모든 필드

**Response 200**:
```typescript
{
  data: AuctionListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
```

**Response 401**: 미인증

**구현 위치**: `src/app/api/properties/route.ts`

**핵심 SQL**:
```typescript
let query = supabase
  .from('v_auction_list')
  .select('*', { count: 'exact' });

if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel);
if (filters.priceMin) query = query.gte('min_bid_amount', filters.priceMin);
if (filters.priceMax) query = query.lte('min_bid_amount', filters.priceMax);
if (filters.searchKeyword) query = query.ilike('address', `%${filters.searchKeyword}%`);
// ...
query = query.order(sortBy, { ascending: sortOrder === 'asc' });
query = query.range((page - 1) * limit, page * limit - 1);
```

### 5-2. `GET /api/properties/[id]`

**Response 200**:
```typescript
{
  property: Property;
  legalAnalysis: LegalAnalysis | null;
  isFavorite: boolean;
}
```

**Response 404**: 매물 없음

### 5-3. `POST /api/favorites`

**Body**:
```typescript
{ propertyId: string; note?: string; folder?: string; }
```

**Response 200**:
```typescript
{ success: true; }
```

**서버 동작**: `auth.uid()`로 user_id 자동 설정, RLS가 검증

### 5-4. `DELETE /api/favorites/[propertyId]`

**Response 200**: `{ success: true }`

### 5-5. `GET /api/favorites`

**Response 200**:
```typescript
{
  data: AuctionListItem[];  // 즐겨찾기한 매물 목록
}
```

---

## 6. UI 컴포넌트 명세

### 6-1. `<RiskBadge level={'상'|'중'|'하'} />`

```tsx
// src/components/auction/risk-badge.tsx
const config = {
  '하': { color: 'bg-green-100 text-green-800', emoji: '🟢', label: '저위험' },
  '중': { color: 'bg-yellow-100 text-yellow-800', emoji: '🟡', label: '중위험' },
  '상': { color: 'bg-red-100 text-red-800', emoji: '🔴', label: '고위험' },
};
```

### 6-2. `<AuctionCard item={AuctionListItem} />`

**렌더링 요소** (모바일 기준):
- 상단 라인: `RiskBadge` + 사건번호 + 법원
- 주소 (2줄 max truncate)
- 가격 라인: 감정가 → 최저가(가율%)
- 하단: 매각기일 (D-N) + 유찰횟수 + 즐겨찾기 버튼

**Props**:
```typescript
interface AuctionCardProps {
  item: AuctionListItem;
  onFavoriteToggle?: () => void;
}
```

**클릭 동작**: `Link` 컴포넌트로 `/auction/[id]` 이동

### 6-3. `<AuctionFilters value, onChange />`

**필터 항목** (UI 순서):
1. 위험도 칩 (전체/하/중/상)
2. 가격 범위 슬라이더 (0 ~ 30억)
3. 물건 종류 셀렉트 (아파트/다세대/오피스텔 등)
4. 유찰 최소회수 (0/1/2/3회+)
5. 매각기일 (오늘/이번주/이번달/전체)
6. 키워드 검색 (주소/단지명)
7. 정렬 (매각기일 임박순/가격 낮은순/유찰 많은순/최신순)

**모바일**: 필터 버튼 → 바텀시트
**PC**: 좌측 사이드바 고정

### 6-4. `<AuctionDetail propertyId />`

서버 컴포넌트로 데이터 fetch.

**섹션 구조**:
1. 헤더: 사건번호, 매각기일 (D-N), 즐겨찾기 토글
2. 주소 + 지도 임베드 (Phase 1에서는 정적 카카오맵 이미지로 대체)
3. 가격 정보 카드 (감정가, 최저가, 가율, 유찰)
4. 권리분석 섹션 (LegalAnalysisSection)
5. 물건비고 텍스트
6. 당사자 정보 (collapsible)
7. 감정평가요항 (collapsible)
8. "법원경매정보 원본" 외부 링크 버튼

### 6-5. `<LegalAnalysisSection analysis={LegalAnalysis} />`

**렌더링 요소**:
- 위험도 큰 배지
- 한줄 요약 (큰 텍스트)
- 항목별 카드 그리드 (말소기준권리/임차인/유치권/법정지상권)
  - 각 카드: 아이콘 + 제목 + 설명 + 위험 표시
- 인수권리 리스트 (있을 때만)
- 예상 총 취득비용 (큰 숫자)
- 비용 내역 (낙찰가 + 취득세 + 명도비 + 기타)
- 투자메모 (인용 박스)

### 6-6. `<FavoriteButton propertyId, initialState />`

낙관적 업데이트 (즉시 UI 변경 → API 실패 시 롤백)

```tsx
const [isFav, setIsFav] = useState(initialState);
const toggle = async () => {
  setIsFav(!isFav);  // optimistic
  try {
    if (!isFav) await fetch('/api/favorites', { method: 'POST', body: ... });
    else await fetch(`/api/favorites/${propertyId}`, { method: 'DELETE' });
  } catch {
    setIsFav(isFav);  // rollback
    toast.error('실패');
  }
};
```

### 6-7. 레이아웃 컴포넌트

**모바일 (< 768px)**:
- 상단 헤더 (로고, 검색 아이콘, 알림, 프로필)
- 하단 탭 바 (홈/경매/즐겨찾기/설정)
- 페이지 컨텐츠 (스크롤)

**PC (≥ 768px)**:
- 상단 헤더 (로고, 메뉴, 검색, 프로필 드롭다운)
- 좌측 사이드바 (필터, 메뉴)
- 메인 컨텐츠 (그리드 또는 단일컬럼)
- 우측 패널 (지도 또는 상세 미리보기, 선택사항)

**Tailwind 분기점**: `md:` (768px), `lg:` (1024px)

---

## 7. TASK별 구현 가이드

### TASK-001: Next.js 14 프로젝트 셋업

**명령어**:
```bash
cd C:/Users/user/BBK-Workspace/real-estate-app
npx create-next-app@latest . --typescript --tailwind --app --no-eslint --no-src-dir=false --import-alias "@/*"
```

옵션 답변:
- TypeScript: Yes
- ESLint: Yes (권장)
- Tailwind: Yes
- src/ directory: Yes
- App Router: Yes
- Turbopack: No (안정성)
- import alias: `@/*`

**추가 패키지 설치**:
```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add lucide-react clsx tailwind-merge
pnpm add date-fns
pnpm add @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-toast
pnpm add class-variance-authority
pnpm add -D @types/node
```

**Pretendard 폰트 설치**:
```bash
pnpm add pretendard
```

**완료 조건**: `pnpm dev` → http://localhost:3000 에서 빈 페이지 표시

---

### TASK-002: Supabase 클라이언트 설정

**파일 1**: `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**파일 2**: `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**파일 3**: `src/lib/supabase/service.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

**파일 4**: `src/middleware.ts` (인증 토큰 갱신)
```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### TASK-003: Tailwind + shadcn/ui

```bash
npx shadcn@latest init
```

설정:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**필요한 컴포넌트 추가**:
```bash
npx shadcn@latest add button card input select badge slider dialog sheet toast tabs
```

**`src/app/globals.css`에 Pretendard 적용**:
```css
@import 'pretendard/dist/web/static/pretendard.css';

:root {
  --font-sans: 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
}

@layer base {
  body { font-family: var(--font-sans); }
}
```

---

### TASK-004: 공통 레이아웃

**`src/app/layout.tsx`**:
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'REIA — 부동산 분석 플랫폼',
  description: '경매·매매·전월세·공간대여 통합 분석',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**`src/app/(app)/layout.tsx`** (인증 가드 + 헤더/하단탭):
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/side-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex-1 flex">
        <SideNav className="hidden md:block w-64 border-r" />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  );
}
```

---

### TASK-005: 로그인/회원가입

**`src/app/(auth)/login/page.tsx`**:
- 이메일 + 비밀번호 입력
- "로그인" 버튼 → `supabase.auth.signInWithPassword`
- "매직링크로 로그인" 버튼 → `supabase.auth.signInWithOtp`
- "회원가입" 링크

**`src/app/(auth)/signup/page.tsx`**:
- 이메일 + 비밀번호 + 이름
- "가입" 버튼 → `supabase.auth.signUp`
- 이메일 인증 안내

**`src/app/api/auth/callback/route.ts`** (매직링크 콜백):
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/`);
}
```

**Supabase 대시보드 설정**:
- Authentication → URL Configuration
  - Site URL: `https://reia.vercel.app` (배포 후)
  - Redirect URLs: `http://localhost:3000/**`, `https://reia.vercel.app/**`

---

### TASK-006~007: properties 테이블 마이그레이션 + 데이터 이전

Supabase 대시보드 → SQL Editor에서 0001, 0002 SQL 실행.
0003 (데이터 이전)은 생략 (워커가 새로 수집).

---

### TASK-008: 경매 목록 화면

**`src/app/(app)/auction/page.tsx`**:
```tsx
import { AuctionList } from '@/components/auction/auction-list';
import { AuctionFilters } from '@/components/auction/auction-filters';

export default function AuctionPage({ searchParams }: { searchParams: ... }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">🏛️ 경매 매물</h1>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <AuctionFilters />
        <AuctionList searchParams={searchParams} />
      </div>
    </div>
  );
}
```

**`src/components/auction/auction-list.tsx`** (서버 컴포넌트):
- `searchParams`로 필터 파라미터 받음
- 서버에서 Supabase 조회
- `AuctionCard` 그리드로 렌더링
- 페이지네이션

---

### TASK-009: 경매 상세 화면

**`src/app/(app)/auction/[id]/page.tsx`**:
```tsx
export default async function AuctionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*, legal_analysis(*)')
    .eq('id', params.id)
    .single();

  if (!property) notFound();

  return <AuctionDetail property={property} />;
}
```

**`<AuctionDetail>`** 컴포넌트는 위 6-4 명세대로 구성.

---

### TASK-010: 즐겨찾기 기능

API 라우트 (5-3, 5-4, 5-5) 구현 + `<FavoriteButton>` 컴포넌트 + `/favorites` 페이지.

---

## 8. 워커 (auction-crawler) 통합

### 8-1. 코드 이전

`auction-crawler/` 전체를 `real-estate-app/worker/`로 복사 후 다음 수정:

**`worker/src/db.js`** — 새 properties 테이블 맞춤:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getExistingCaseNumbers() {
  const { data, error } = await supabase
    .from('properties')
    .select('case_number')
    .eq('source', 'auction')
    .not('case_number', 'is', null);
  if (error) throw error;
  return new Set(data.map(r => r.case_number));
}

async function filterNewItems(items) {
  const existing = await getExistingCaseNumbers();
  return items.filter(item => !existing.has(item.caseNumber));
}

async function saveItems(items) {
  if (items.length === 0) return [];
  const rows = items.map(item => ({
    source: 'auction',
    source_id: item.caseNumber,                  // case_number를 source_id로 재사용
    case_number: item.caseNumber,
    court: item.court,
    division: item.division,
    property_type: item.itemType,
    address: item.address,
    price_main: item.appraisalAmount,            // 감정가 = price_main
    price_min_bid: item.minBidAmount,
    min_bid_rate: item.minBidRate,
    fail_count: item.failCount,
    bid_date: item.bidDate || null,
    claim_amount: item.claimAmount || 0,
    item_note: item.itemNote || '',
    parties: item.parties || {},
    appraisal_summary: item.appraisalSummary || '',
    raw_data: item,
  }));

  const { data, error } = await supabase
    .from('properties')
    .upsert(rows, { onConflict: 'source,source_id' })
    .select();

  if (error) throw error;
  console.log(`💾 DB 저장 완료: ${data.length}건`);
  return data;
}

async function saveAnalysis(items) {
  for (const item of items) {
    if (!item.analysis) continue;

    const { data: prop } = await supabase
      .from('properties')
      .select('id')
      .eq('source', 'auction')
      .eq('source_id', item.caseNumber)
      .single();

    if (!prop) continue;

    await supabase
      .from('legal_analysis')
      .upsert({
        property_id: prop.id,
        risk_level: item.analysis.risk_level,
        risk_summary: item.analysis.risk_summary,
        liquidation_reference_right: item.analysis.liquidation_reference_right,
        inherited_rights: item.analysis.inherited_rights || [],
        lessee_risk: item.analysis.lessee_risk || {},
        lien_risk: item.analysis.lien_risk || {},
        legal_ground_right: item.analysis.legal_ground_right || {},
        estimated_total_cost: item.analysis.estimated_total_cost || 0,
        cost_breakdown: item.analysis.cost_breakdown || {},
        investment_memo: item.analysis.investment_memo || '',
        raw_analysis: JSON.stringify(item.analysis),
      }, { onConflict: 'property_id' });
  }
}

module.exports = { filterNewItems, saveItems, saveAnalysis };
```

**`worker/src/reporter.js`**: Phase 1에서는 이메일 발송 비활성화 (Phase 5에서 부활). `index.js`의 sendReport 호출 부분 주석 처리.

### 8-2. GitHub Actions — `.github/workflows/daily-crawl.yml`

```yaml
name: Daily Auction Crawl

on:
  schedule:
    - cron: '0 23 * * *'  # 매일 오전 8시 KST
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: worker/package-lock.json
      - run: npm ci
        working-directory: worker
      - run: npx playwright install chromium --with-deps
        working-directory: worker
      - run: node src/index.js
        working-directory: worker
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - if: failure()
        run: |
          curl -s -X POST -H 'Content-type: application/json' \
            --data '{"text":"❌ *REIA 크롤러 실패*"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 9. 인수 테스트 시나리오

### 9-1. 인증 테스트
- [ ] `/signup` 접속 → 이메일/비밀번호 입력 → 가입 성공
- [ ] 메일 인증 클릭 → `/` 진입
- [ ] `/login` → 잘못된 비밀번호 → 에러 표시
- [ ] 올바른 비밀번호 → 홈 진입
- [ ] `/auction` 비로그인 접속 → `/login`으로 리다이렉트

### 9-2. 경매 목록 테스트
- [ ] `/auction` 접속 → 매물 목록 카드 그리드 표시
- [ ] 위험도 "하" 필터 → URL 쿼리 변경 + 결과 갱신
- [ ] 가격 슬라이더 1억~5억 → 결과 필터링
- [ ] 정렬 변경 → 순서 변경
- [ ] 페이지 2 → 다음 매물

### 9-3. 경매 상세 테스트
- [ ] 카드 클릭 → 상세 페이지 진입
- [ ] 권리분석 섹션 모든 카드 렌더링
- [ ] 즐겨찾기 토글 → 즉시 반영
- [ ] 새로고침 후 즐겨찾기 상태 유지

### 9-4. 즐겨찾기 페이지
- [ ] `/favorites` 접속 → 즐겨찾기한 매물만 표시
- [ ] 다른 가족 계정 로그인 → 본인 즐겨찾기만 보임 (RLS 검증)

### 9-5. 반응형 테스트
- [ ] 모바일 (375px): 1열 카드, 하단 탭바
- [ ] 태블릿 (768px): 2열 카드, 사이드바 등장
- [ ] PC (1280px): 3열 카드, 사이드바 + 메인

### 9-6. 워커 테스트
- [ ] GitHub Actions 수동 실행 → 워커 정상 종료
- [ ] Supabase `properties` 테이블에 source='auction' 데이터 존재
- [ ] `legal_analysis` 테이블에 분석 결과 존재
- [ ] 다음 날 수동 실행 → 중복 없이 신규 매물만 추가

---

## 10. TASK별 예상 시간 및 일정 (2주 = 10영업일)

| TASK | 내용 | 예상시간 | 누적 |
|------|------|---------|------|
| TASK-001 | Next.js 프로젝트 셋업 | 2시간 | 2h |
| TASK-002 | Supabase 클라이언트 + 미들웨어 | 3시간 | 5h |
| TASK-003 | Tailwind + shadcn 초기화 | 1시간 | 6h |
| TASK-004 | 공통 레이아웃 (헤더/탭바) | 5시간 | 11h |
| TASK-005 | 로그인/회원가입 | 5시간 | 16h |
| TASK-006 | DB 마이그레이션 적용 | 1시간 | 17h |
| TASK-007 | (생략 — 워커 신규 수집) | 0시간 | 17h |
| TASK-007b | 워커 통합 (auction-crawler 이전) | 4시간 | 21h |
| TASK-008 | 경매 목록 화면 + 필터 | 8시간 | 29h |
| TASK-009 | 경매 상세 화면 + 권리분석 표시 | 6시간 | 35h |
| TASK-010 | 즐겨찾기 기능 (API + UI) | 4시간 | 39h |
| 통합 테스트 | 9-1 ~ 9-6 시나리오 | 4시간 | 43h |
| 배포 | Vercel 연결 + 환경변수 + GitHub Actions | 2시간 | 45h |
| 버퍼 | 디버깅/리팩터 | 5시간 | 50h |

**총 약 50시간 = 영업일 6.25일 (8h/day) → 1주 + 여유 1주**

---

## 11. Sonnet 구현 시작 전 체크리스트

사용자(또는 Opus)가 구현 시작 전 준비:
- [ ] Supabase 신규 프로젝트 생성 + URL/키 확보
- [ ] GitHub 신규 저장소 생성 + 비공개 설정
- [ ] Vercel 계정에 GitHub 저장소 연결
- [ ] 가족 구성원 이메일 목록 확보 (가입 안내용)
- [ ] `.env.local` 작성 완료
- [ ] 도메인 결정 (기본 `reia.vercel.app` or 커스텀)

Sonnet에게 전달할 명령:
> "PHASE-1-SPEC.md를 따라 TASK-001부터 순차 구현해. 각 TASK 완료 시 git commit 한 번씩. 예상하지 못한 결정사항이 생기면 멈추고 물어봐."

---

## 12. Phase 1 완료 후 다음 단계

Phase 1이 완료되면 본 문서 작성자(Opus)가 **PHASE-2-SPEC.md** 작성:
- profit_scenarios 테이블 설계 (상세)
- 수익성 계산 라이브러리 명세 (`lib/profit-calculator.ts` 함수 시그니처)
- 시나리오 입력/저장/비교 UI 컴포넌트 명세
- 차트 시각화 (Recharts) 명세
- 자동 추천 시나리오 알고리즘

Phase 2 예상 기간: 2주

---

**끝.** 이 문서는 Sonnet이 받아 그대로 구현할 수 있는 수준의 명세서입니다.
