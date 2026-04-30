# 부동산 통합 분석 플랫폼 — 프로젝트 기획서

> 작성일: 2026-04-30
> 작성 모델: Claude Opus 4.7 (계획 단계)
> 구현 모델: Claude Sonnet 4.6 (코드 작성 단계)
> 프로젝트명: 가칭 **REIA** (Real Estate Investment Analyzer)

---

## 0. 프로젝트 비전

### 한 문장 정의
**"경매·매매·전월세·공간대여 4개 트랙의 부동산 매물을 한 화면에서 검색·권리분석·수익성 시뮬레이션까지 끝내는 통합 분석 앱"**

### 차별화 포인트
| 기존 앱 | REIA |
|---------|------|
| 매물 목록만 보여줌 (네이버부동산, 직방) | 매물 + AI 권리분석 + 수익률 자동 계산 |
| 경매 정보만 (탱크옥션, 굿옥션 등 유료) | 경매 무료 + 일반 매물 통합 |
| 공간대여업 분석 도구 없음 | 에어비앤비/파티룸 적합 매물 자동 스코어링 |
| 수익성 계산기는 별도 도구 | 매물 클릭 → 즉시 ROI/IRR 시뮬레이션 |

---

## 1. 사용자 페르소나 및 핵심 시나리오

### 페르소나 A — 경매 투자자
> 40대 자영업자, 경매로 임대수익 부동산 확보 희망  
> 권리분석에 자신 없어 유찰 많은 안전한 물건 위주로 보고 싶음

**핵심 시나리오**:
1. 앱 실행 → "경매" 탭 → 위험도 "하" 필터
2. 관심 물건 클릭 → 권리분석 + 예상 낙찰가 + 임대 수익률 표시
3. "내 자금 5억" 입력 → 자기자본수익률(ROE), 월 현금흐름 자동 계산
4. 즐겨찾기 추가 → 매각기일 D-7 알림

### 페르소나 B — 실거주/투자 매수자
> 30대 직장인, 강남 인근 30평대 아파트 매수 검토  
> 매물 비교에 시간이 너무 걸려 효율화 원함

**핵심 시나리오**:
1. "매매" 탭 → 지역(강남구) + 평수(30평) + 가격(15억) 조건 설정
2. 국토부 실거래가 데이터 + 사용자가 붙여넣은 네이버부동산 URL 분석
3. "이 가격 적정한가요?" → 동일 단지 최근 6개월 거래가 vs 호가 비교
4. "월 임대 시 수익은?" → 보증금/월세/관리비 시뮬레이션

### 페르소나 C — 공간대여업 운영 희망자
> 30대 부업 희망자, 에어비앤비 또는 파티룸 운영 후보지 탐색

**핵심 시나리오**:
1. "공간대여" 탭 → 종류(파티룸/에어비앤비/스튜디오) 선택
2. 후보 지역 입력 → 지역 적합성 점수 (관광 수요/접근성/경쟁밀도)
3. 매물 후보지 클릭 → 인근 동일 업종 평균 단가/예약률/예상 매출
4. "월세 200만원으로 파티룸 운영 시 손익분기점은?" 자동 계산

---

## 2. 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                       │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│   │  경매     │ │  매매     │ │  전월세   │ │ 공간대여  │  │
│   │  Track   │ │  Track   │ │  Track   │ │  Track   │  │
│   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
│         └─────────────┴─────────────┴─────────────┘         │
│                       │                                      │
│              ┌────────▼────────┐                            │
│              │ 통합 분석 모듈   │                            │
│              │ (수익성 시뮬레이션)│                          │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼─────────┐
        │ Next.js API    │         │ 외부 데이터 수집 │
        │ Route Handlers │         │ (Worker 서버)    │
        │ (Vercel)       │         │                  │
        └───────┬────────┘         └────────┬─────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │     Supabase       │
                    │  (PostgreSQL +     │
                    │   Storage + Auth)  │
                    └────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Data Workers (별도 서버/Actions)       │
│  • Playwright Crawler (경매)                                 │
│  • 국토부 API Poller (실거래가)                              │
│  • Stay Market Analyzer (공간대여 시세)                      │
│  • Claude AI Analyzer (권리분석/투자분석)                    │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 설계 원칙

1. **Frontend는 절대 크롤링 안 함** — Vercel Serverless에서 Playwright 실행 불가, Worker 분리
2. **데이터 수집은 비동기 배치** — GitHub Actions / 별도 VPS에서 정기 실행 → DB에 저장
3. **사용자는 항상 DB만 읽음** — 매물 클릭 시 즉시 응답 (실시간 크롤링 X)
4. **AI 분석은 캐싱** — 같은 물건 재분석 안 함 (auction_analysis 테이블의 패턴 유지)

---

## 3. 데이터 소스 매트릭스 (가장 중요한 결정)

각 트랙별로 어떤 데이터를 어디서 어떻게 가져올지 명시.

### 3-1. 경매 트랙

| 항목 | 결정 |
|------|------|
| 출처 | 법원경매정보 (courtauction.go.kr) |
| 방식 | Playwright 크롤링 (이미 구현됨) |
| 라이선스 | 공공데이터, 비상업 이용 자유 |
| 갱신 주기 | 매일 1회 (오전 8시 KST) |
| 비용 | 무료 |

→ **이미 `auction-crawler` 프로젝트에서 구축 완료**. 그대로 재활용.

### 3-2. 매매 트랙

| 데이터 종류 | 출처 | 방식 | 비고 |
|------------|------|------|------|
| 실거래가 (정답 데이터) | **국토교통부 실거래가 공개시스템 API** | 공공데이터포털 OpenAPI | 무료, 안정적, 권장 |
| 호가/매물 정보 | 네이버부동산 / 직방 / 호갱노노 | **사용자 URL 붙여넣기 → 단건 파싱** | 대량 크롤링 X |
| 단지 정보 | KB부동산 시세 | 공공API에 없으면 수동 매핑 | 대안: 카카오 로컬 API |
| 학군/교통 | 학교알리미 API + 카카오 로컬 | 공공API | 가산점 계산용 |

**핵심 전략 — "URL 붙여넣기 분석"**:
사용자가 네이버부동산에서 본 매물 URL을 앱에 붙여넣으면, 서버가 그 단건만 파싱해 분석. 대량 크롤링이 아니라 사용자 의도 기반 1회성 호출이므로 차단 위험 낮고, 약관 측면에서도 사용자 본인이 본 정보를 본인이 분석하는 것에 가까움.

### 3-3. 전월세 트랙

| 데이터 종류 | 출처 | 방식 |
|------------|------|------|
| 전월세 실거래가 | **국토교통부 전월세 실거래가 API** | 공공데이터포털 OpenAPI |
| 매물 호가 | 직방/다방/네이버 | URL 붙여넣기 (매매 트랙과 동일) |
| 시세 분석 | 자체 계산 | 동일 단지/지역 거래가 회귀분석 |

### 3-4. 공간대여 트랙

| 데이터 종류 | 출처 | 방식 |
|------------|------|------|
| 후보지 매물 | 매매/전월세 트랙에서 필터링 | 자체 DB |
| 공간대여 시세 | 스페이스클라우드 / 아이러브파티룸 | **공개 검색 결과 단건 파싱** |
| 에어비앤비 시세 | AirDNA (유료) 또는 공개 통계 | 외부 통계 활용 |
| 관광 수요 | 한국관광공사 API | 공공API |
| 인구/유동인구 | KOSIS 통계청 | 공공API |
| 경쟁업체 밀도 | 카카오/네이버 지도 검색 API | 합법 API |

**공간대여 적합도 점수 (Score)**: 0~100점
```
score = (입지 점수 30%) + (수요 점수 25%) + (경쟁 점수 20%)
      + (건물 적합도 15%) + (수익성 점수 10%)
```

### 3-5. 데이터 정책 비교표

| 출처 | 합법성 | 안정성 | 비용 | 채택 |
|------|--------|--------|------|------|
| 국토부 공공API | ✅ 명시적 허가 | ✅ 정부 운영 | 무료 | **메인** |
| 법원경매 크롤링 | ✅ 공공데이터 | △ 사이트 변경 위험 | 무료 | **메인** |
| 네이버부동산 대량크롤링 | ❌ robots.txt 위배 | ❌ 차단 강함 | 무료 | **불채택** |
| 사용자 URL 단건파싱 | △ 회색지대 | ✅ 단건이라 안정 | 무료 | **채택** |
| 직방 비공식 API | ❌ 약관 위반 | ❌ | 무료 | **불채택** |
| AirDNA | ✅ 라이선스 가능 | ✅ | 유료 | 선택사항 |

---

## 4. DB 스키마 설계 (Supabase 확장)

기존 `auction_items`, `auction_analysis` 유지하고 추가:

### 4-1. 통합 매물 테이블 — `properties`

매매·전월세·공간대여를 모두 담는 마스터 테이블.

```sql
CREATE TABLE properties (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source             text NOT NULL,              -- 'auction' | 'sale' | 'rent' | 'lease' | 'space'
  source_id          text NOT NULL,              -- 출처 시스템 고유ID (URL 또는 사건번호)
  external_url       text,                       -- 원본 URL (네이버부동산 등)

  -- 공통 필드
  title              text,
  property_type      text,                       -- 'apt' | 'villa' | 'house' | 'office' | 'shop'
  address            text,
  address_road       text,                       -- 도로명 주소
  latitude           numeric(10, 7),
  longitude          numeric(10, 7),
  area_m2            numeric(10, 2),             -- 전용면적
  area_pyeong        numeric(10, 2),             -- 평수
  floor              int,                        -- 해당 층
  total_floors       int,                        -- 총 층수
  built_year         int,

  -- 가격 정보 (트랙별 의미 다름)
  price_main         bigint,                     -- 매매가 / 감정가 / 전세금
  price_deposit      bigint,                     -- 보증금
  price_monthly      bigint,                     -- 월세
  price_min_bid      bigint,                     -- 경매 최저매각가
  min_bid_rate       int,                        -- 최저매각가율 (%)

  -- 메타
  raw_data           jsonb DEFAULT '{}',         -- 원본 데이터 그대로
  crawled_at         timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now(),

  UNIQUE(source, source_id)
);

CREATE INDEX idx_properties_source ON properties(source);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_geo ON properties(latitude, longitude);
CREATE INDEX idx_properties_address ON properties USING gin(to_tsvector('simple', address));
```

### 4-2. 권리분석 테이블 — `legal_analysis` (auction_analysis 일반화)

```sql
CREATE TABLE legal_analysis (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        uuid UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  risk_level         text,                       -- '상' | '중' | '하'
  risk_summary       text,
  inherited_rights   jsonb DEFAULT '[]',
  lessee_risk        jsonb DEFAULT '{}',
  lien_risk          jsonb DEFAULT '{}',
  legal_ground_right jsonb DEFAULT '{}',
  raw_analysis       text,
  analyzed_at        timestamptz DEFAULT now()
);
```

### 4-3. 시세 분석 테이블 — `market_analysis`

```sql
CREATE TABLE market_analysis (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        uuid REFERENCES properties(id) ON DELETE CASCADE,

  comparable_recent_avg     bigint,              -- 동일 단지 6개월 평균 실거래가
  comparable_count          int,                 -- 비교 매물 수
  price_position            text,                -- 'overpriced' | 'fair' | 'underpriced'
  price_diff_pct            numeric(5, 2),       -- 시세 대비 차이 (%)

  expected_monthly_rent     bigint,              -- 월세 예상
  expected_jeonse           bigint,              -- 전세 예상
  rental_yield_pct          numeric(5, 2),       -- 임대수익률 (%)

  analyzed_at        timestamptz DEFAULT now()
);
```

### 4-4. 수익성 시뮬레이션 테이블 — `profit_scenarios`

사용자가 입력한 "내 자금/대출/리모델링비"별로 여러 시나리오 저장.

```sql
CREATE TABLE profit_scenarios (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES auth.users(id),
  scenario_name      text NOT NULL,              -- '시나리오 A: 보수적'

  -- 입력값
  input_acquisition_cost     bigint,             -- 취득금액 (낙찰가/매매가)
  input_own_capital          bigint,             -- 자기자본
  input_loan_amount          bigint,             -- 대출금
  input_loan_rate_pct        numeric(5, 2),      -- 대출금리
  input_renovation_cost      bigint,             -- 리모델링비
  input_eviction_cost        bigint,             -- 명도비 (경매)
  input_other_cost           bigint,             -- 기타비용
  usage_type                 text,               -- 'sale' | 'rent_jeonse' | 'rent_monthly' | 'space_rental'

  -- 출력값
  total_acquisition_cost     bigint,             -- 총 취득비용
  expected_monthly_income    bigint,             -- 월 예상수익
  expected_yearly_noi        bigint,             -- 연 순영업소득 (NOI)
  expected_yearly_cashflow   bigint,             -- 연 현금흐름 (이자 차감)
  roi_pct                    numeric(5, 2),      -- ROI %
  roe_pct                    numeric(5, 2),      -- 자기자본수익률 %
  payback_period_years       numeric(4, 1),      -- 회수기간

  created_at         timestamptz DEFAULT now()
);
```

### 4-5. 사용자 설정 — `user_filters`

조건을 DB에 저장해 다중 디바이스 동기화.

```sql
CREATE TABLE user_filters (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id),
  track              text NOT NULL,              -- 'auction' | 'sale' | 'rent' | 'space'
  name               text NOT NULL,              -- '강남 아파트 5억'
  filters            jsonb NOT NULL,             -- 검색 조건
  notify_enabled     boolean DEFAULT false,
  created_at         timestamptz DEFAULT now()
);
```

### 4-6. 즐겨찾기 — `favorites`

```sql
CREATE TABLE favorites (
  user_id     uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
```

### 4-7. 공간대여 적합도 — `space_rental_score`

```sql
CREATE TABLE space_rental_score (
  property_id        uuid PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  total_score        int,                        -- 0~100
  location_score     int,                        -- 입지 (역세권/관광지)
  demand_score       int,                        -- 수요 (유동인구/관광객)
  competition_score  int,                        -- 경쟁 강도 (낮을수록 높음)
  building_score     int,                        -- 건물 적합도
  profitability_score int,                       -- 수익성

  rental_type_fit    jsonb,                      -- {"airbnb": 85, "party_room": 60, "studio": 70}
  nearby_competitors int,                        -- 반경 1km 내 동종 업체 수
  avg_competitor_price bigint,                   -- 인근 평균 단가
  computed_at        timestamptz DEFAULT now()
);
```

---

## 5. 화면 설계

### 5-1. 정보 구조 (IA)

```
앱 진입
├─ 홈 (Dashboard)
│   ├─ 추천 매물 (즐겨찾기 조건 기반)
│   ├─ 오늘의 신규 (4개 트랙별)
│   └─ 알림 / 공지
│
├─ 검색 (4개 트랙)
│   ├─ 경매
│   │   ├─ 목록
│   │   ├─ 지도 보기
│   │   └─ 상세 → 권리분석 → 수익성
│   ├─ 매매
│   │   ├─ 조건 검색
│   │   ├─ URL 붙여넣기 분석
│   │   └─ 상세 → 시세분석 → 수익성
│   ├─ 전월세
│   │   └─ 동일 구조
│   └─ 공간대여
│       ├─ 적합도 순 정렬
│       └─ 상세 → 시장분석 → 수익성
│
├─ 내 매물 (My)
│   ├─ 즐겨찾기
│   ├─ 저장한 시나리오
│   └─ 알림 조건
│
└─ 설정
    ├─ 검색 조건 저장
    ├─ 알림 설정
    └─ 계정
```

### 5-2. 핵심 화면 와이어프레임 (텍스트로 표현)

#### 화면 A — 통합 검색 결과 (모바일 우선)

```
┌─────────────────────────────────┐
│ ← 검색         🔍   🔔   ⚙️    │ ← 헤더
├─────────────────────────────────┤
│ [경매][매매][전월세][공간대여]  │ ← 트랙 탭
├─────────────────────────────────┤
│ 🔽 위험도:하  💰 1~5억  📅 매각순│ ← 필터 칩
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │🟢 2024타경117137  서울중앙   │ │ ← 매물 카드
│ │서울 강남 역삼로25길 21      │ │
│ │💵 감정 1.7억 → 최저 1.2억(70%)│ │
│ │📅 D-7  ✅ 권리:안전          │ │
│ │💼 ROI 8.5% (예상)            │ │
│ │       [상세] [♥]             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │🟡 ...                        │ │
│ └─────────────────────────────┘ │
│   [지도보기]    [더 불러오기]   │
└─────────────────────────────────┘
```

#### 화면 B — 매물 상세 (모바일)

```
┌─────────────────────────────────┐
│ ← 매물상세           ♥  ⋮      │
├─────────────────────────────────┤
│ [📷 사진 슬라이더]              │
├─────────────────────────────────┤
│ 🏢 서울 강남구 역삼로25길 21    │
│ 사건번호: 2024타경117137        │
│ 매각기일: 2026.05.06 (D-6)      │
├─────────────────────────────────┤
│ 💰 가격 정보                    │
│  감정가     171,000,000원        │
│  최저가     119,700,000원 (70%)  │
│  유찰       1회                 │
├─────────────────────────────────┤
│ ✅ 권리분석 (위험도: 하)        │
│  • 말소기준권리: 근저당권       │
│  • 임차인: 대항력 없음          │
│  • 유치권/법정지상권: 없음      │
│  • 인수권리: 없음               │
│  💡 명도 용이, 안전한 물건      │
│         [상세분석 보기 ▼]       │
├─────────────────────────────────┤
│ 📊 수익성 시뮬레이션            │
│ ┌──────────────────────────┐   │
│ │ 시나리오: 보수적 ▼       │   │
│ │ 입찰가      135,000,000  │   │
│ │ + 취득세    3,000,000    │   │
│ │ + 명도비    1,000,000    │   │
│ │ + 리모델링  20,000,000 ✏ │   │ ← 수동 입력 가능
│ │ ─────────────            │   │
│ │ 총취득      159,000,000  │   │
│ │ 월 예상임대 850,000      │   │
│ │ ROI         6.4% / 연    │   │
│ │ 회수기간     15.6년       │   │
│ │ [시나리오 저장] [수정]    │   │
│ └──────────────────────────┘   │
├─────────────────────────────────┤
│ 🗺️ 지도 (카카오맵 임베드)       │
└─────────────────────────────────┘
```

#### 화면 C — PC 레이아웃 (1024px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ REIA  [홈][경매][매매][전월세][공간대여]    🔍   🔔   👤        │
├──────────┬──────────────────────────────┬──────────────────────┤
│           │                              │                      │
│ 필터       │ 매물 카드 그리드              │ 지도 / 상세          │
│ 사이드바   │ (3열)                        │ (지도 또는 선택매물) │
│           │                              │                      │
│ ☑ 위험도  │ ┌────┐ ┌────┐ ┌────┐         │ [지도]               │
│  □ 하     │ │카드│ │카드│ │카드│         │  핀 클러스터링       │
│  □ 중     │ └────┘ └────┘ └────┘         │                      │
│           │ ┌────┐ ┌────┐ ┌────┐         │ [선택매물 미리보기]  │
│ 가격대    │ │카드│ │카드│ │카드│         │  ROI 8.5%            │
│ ──●──    │ └────┘ └────┘ └────┘         │                      │
│           │                              │                      │
└──────────┴──────────────────────────────┴──────────────────────┘
```

#### 화면 D — 공간대여 적합도 점수 시각화

```
┌─────────────────────────────────┐
│ 🏠 신촌 다세대 2층 (전용 25평)  │
│                                 │
│ 📊 공간대여 적합도              │
│ ┌──────────────────────────┐   │
│ │ 종합점수      ⭐ 84/100  │   │
│ │                           │   │
│ │ 입지         ████████ 85 │   │
│ │ 수요         ███████  75 │   │
│ │ 경쟁         █████    50 │   │
│ │ 건물 적합도  █████████ 95│   │
│ │ 수익성       ████████ 80 │   │
│ │                           │   │
│ │ 추천 업종                 │   │
│ │  파티룸     ⭐ 90        │   │
│ │  스튜디오   ⭐ 75        │   │
│ │  에어비앤비 ⭐ 65        │   │
│ └──────────────────────────┘   │
│                                 │
│ 📈 인근 시세 (반경 1km)         │
│  파티룸 평균 시간당 30,000원    │
│  주말 점유율 평균 75%           │
│  경쟁업체 8개                   │
└─────────────────────────────────┘
```

### 5-3. 디자인 시스템

| 요소 | 값 |
|------|-----|
| 컬러 | BBK 디자인 토큰 재활용 (BBK 앱과 통합 시) |
| 위험도 색 | 🟢 #2E7D32 / 🟡 #F57F17 / 🔴 #C62828 |
| 폰트 | Pretendard (한글 가독성) |
| 그리드 | 모바일 1열 / 태블릿 2열 / PC 3열 |
| 컴포넌트 | shadcn/ui (Tailwind + Radix) |
| 차트 | Recharts (수익성 시뮬레이션 그래프) |
| 지도 | 카카오맵 SDK |
| 아이콘 | Lucide React |

---

## 6. 핵심 기능 명세

### 6-1. 통합 검색 엔진

**입력**:
- 키워드 (지역, 단지명)
- 트랙 (경매/매매/전월세/공간대여)
- 가격 범위
- 면적 범위
- 위험도 (경매), 수익률 (매매/전월세), 적합도 (공간대여)

**출력**: `properties` 테이블에서 조건 매칭 결과 + 분석 데이터 조인

**구현 메모**: PostgreSQL `tsvector`로 한국어 주소 전문검색, 지리 검색은 PostGIS 확장 또는 단순 lat/lng 범위 쿼리.

### 6-2. 권리분석 (경매)

이미 `auction-crawler/src/analyzer.js`에 구현됨. Claude Haiku 사용. 그대로 재활용.

### 6-3. 시세 분석 (매매/전월세)

**알고리즘**:
1. 동일 주소/단지 최근 6개월 실거래가 조회 (국토부 API)
2. 면적·층 가중평균으로 적정 시세 계산
3. 호가/매물가 입력 시 시세 대비 % 차이 표시
4. 단지 가격 추세 그래프 (월별 평균)

**Claude 보조분석**: "이 단지 시세 추세와 매물 정보 종합 평가" → 자연어 요약

### 6-4. 공간대여 적합도 스코어

**입지 점수 (30%)**:
- 지하철역 거리 (500m 이내 +30, 1km 이내 +20)
- 관광지/번화가 거리
- 도로 접근성

**수요 점수 (25%)**:
- 인근 호텔 평균 점유율
- 외국인 관광객 통계
- 주변 인구 밀도

**경쟁 점수 (20%)** — 낮을수록 좋음:
- 카카오/네이버 지도에서 동종 업종 검색
- 반경 1km 내 개수 → 5개 이하 만점, 10개 이상 0점

**건물 적합도 (15%)**:
- 단독 출입구 여부
- 면적 (파티룸 15~30평, 에어비앤비 8~20평 적정)
- 층수 (1층 보너스, 옥탑 감점)

**수익성 점수 (10%)**:
- 인근 시세 대비 임대료 부담률
- 예상 손익분기점

### 6-5. 수익성 시뮬레이션

**자동 계산 입력값**:
- 입찰가/매매가 (DB에서 가져옴)
- 취득세 (1.1% / 2.2% / 3.3% 자동 적용)
- 예상 월세 (시세 분석 결과)

**수동 입력값**:
- 자기자본 / 대출금액 / 대출금리
- 리모델링비
- 명도비 (경매 시)
- 운영비 (공간대여 시: 청소비/플랫폼 수수료/공과금)

**자동 출력값**:
```
총취득비용    = 매수가 + 취득세 + 명도비 + 리모델링비 + 기타
연 임대수익   = 월세 × 12 + 보증금 운용수익 (3% 가정)
연 운영비    = 공실률(5%) + 관리비 + 수선비
NOI          = 연 임대수익 - 연 운영비
연 이자비용  = 대출금 × 금리
연 현금흐름  = NOI - 이자
ROI          = NOI / 총취득비용 × 100
ROE (자기자본수익률) = 연현금흐름 / 자기자본 × 100
회수기간     = 자기자본 / 연 현금흐름
```

**시나리오 저장**: 사용자가 여러 시나리오(보수/공격) 저장 → 비교 화면

### 6-6. 알림 시스템

**조건 설정**: 사용자가 검색 조건을 저장 → `user_filters.notify_enabled = true`

**알림 트리거**:
- 새 매물 등장 (조건 매칭)
- 즐겨찾기 매물 가격 변동
- 매각기일 D-7

**채널**:
- 이메일 (nodemailer + Gmail) — 기본
- 카카오 알림톡 (BBK 인프라 재활용)
- Slack (관리자용)
- 앱 내 푸시 (PWA + Web Push)

### 6-7. 즐겨찾기 & 메모

각 매물에 메모/태그 추가, 폴더 분류 ("관심", "입찰예정", "보류").

---

## 7. 기술 스택

### Frontend
| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 폼 | react-hook-form + zod |
| 차트 | Recharts |
| 지도 | 카카오맵 SDK |
| 상태관리 | React Context + React Query (서버상태) |
| PWA | next-pwa (모바일 앱 느낌) |

### Backend
| 항목 | 기술 |
|------|------|
| API | Next.js API Routes (Vercel) |
| DB | Supabase PostgreSQL (BBK 프로젝트 재활용) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (사진/PDF) |
| AI | Claude Haiku (권리분석) + Claude Sonnet (시장분석) |

### Workers (별도 서버)
| 항목 | 기술 |
|------|------|
| 크롤러 | Playwright (Node.js) |
| 스케줄러 | GitHub Actions (현재) → 추후 VPS cron |
| 공공API 폴러 | Node.js + node-fetch |

### DevOps
| 항목 | 기술 |
|------|------|
| 배포 | Vercel (Frontend), GitHub Actions (Worker) |
| 모니터링 | Vercel Analytics + Slack 알림 |
| 에러 추적 | Sentry (선택) |

---

## 8. 개발 단계 (Phase 0 ~ Phase 5)

### Phase 0: 프로젝트 셋업 (1주)
- Next.js 14 프로젝트 생성
- Supabase 연동 (BBK 프로젝트 재활용)
- 디자인 시스템 셋업 (Tailwind + shadcn)
- 인증 (BBK 앱과 SSO 또는 별도)
- 통합 properties 테이블 마이그레이션
- 기존 auction_items 데이터를 properties로 이전

**완료 조건**: 빈 화면이라도 배포 URL에서 로그인 → 홈 진입 가능

### Phase 1: 경매 트랙 (2주)
- 기존 auction-crawler를 통합 properties로 데이터 변환
- 경매 목록/상세 화면
- 기존 권리분석 결과 표시
- 즐겨찾기 기능

**완료 조건**: 매일 자동 크롤링되어 앱에서 경매 매물 검색·즐겨찾기 가능

### Phase 2: 수익성 시뮬레이션 (2주)
- profit_scenarios 테이블 + UI
- 자동 계산 로직 (취득세/예상수익)
- 시나리오 저장/비교 화면
- 차트 시각화

**완료 조건**: 경매 매물 클릭 → ROI 계산 → 시나리오 저장 가능

### Phase 3: 매매/전월세 트랙 (3주)
- 국토부 공공API 연동 워커
- properties 테이블 일반화
- URL 붙여넣기 분석 기능 (네이버부동산 단건 파싱)
- 시세 분석 알고리즘 + market_analysis 테이블
- 검색 화면 (지도/목록/필터)

**완료 조건**: 강남구 아파트 검색 → 실거래가 비교 → 수익성 계산 일관 동작

### Phase 4: 공간대여 트랙 (3주)
- 카카오 로컬 API 연동 (경쟁업체 수집)
- 공간대여 시세 분석 워커
- space_rental_score 계산 알고리즘
- 적합도 시각화 화면 (라이더 차트, 점수 바)

**완료 조건**: 주소 입력 → 적합도 점수 + 추천 업종 + 경쟁 분석 표시

### Phase 5: 알림 + PWA + 마무리 (2주)
- 알림 조건 저장/관리
- 이메일/카카오 알림톡 전송
- PWA 설정 (홈화면 추가 가능)
- 모바일 푸시 알림
- 성능 최적화 (이미지/번들/쿼리)

**완료 조건**: 매일 오전 8시 신규 매물 알림 자동 발송, 모바일 홈에 앱 설치 가능

### 총 일정: **약 13주 (3.2개월)**

---

## 9. 작업 분해 (Sonnet 구현용 Task List)

```
TASK-001  Next.js 14 프로젝트 셋업
TASK-002  Supabase 클라이언트 설정 (server/client 분리)
TASK-003  Tailwind + shadcn/ui 초기화
TASK-004  공통 레이아웃 (헤더/사이드바/하단탭)
TASK-005  로그인/회원가입 (Supabase Auth)
TASK-006  properties 테이블 마이그레이션
TASK-007  auction_items → properties 데이터 이전 스크립트
TASK-008  경매 목록 화면 (필터/정렬/페이지네이션)
TASK-009  경매 상세 화면 (권리분석 표시)
TASK-010  즐겨찾기 기능 (favorites 테이블 + UI)
TASK-011  profit_scenarios 테이블 마이그레이션
TASK-012  수익성 계산 로직 라이브러리 (lib/profit-calculator.ts)
TASK-013  시나리오 입력 UI + 결과 카드
TASK-014  시나리오 저장/불러오기/비교
TASK-015  차트 시각화 (Recharts)
TASK-016  국토부 실거래가 API 연동 워커
TASK-017  매매 검색 화면
TASK-018  URL 붙여넣기 분석 API 라우트
TASK-019  시세 분석 로직 (market_analysis)
TASK-020  매매 상세 화면
TASK-021  전월세 검색/상세 (매매 코드 재활용)
TASK-022  카카오맵 SDK 통합
TASK-023  지도 보기 화면 (핀 클러스터링)
TASK-024  카카오 로컬 API 연동 (경쟁업체 검색)
TASK-025  공간대여 시세 데이터 수집 워커
TASK-026  space_rental_score 계산 로직
TASK-027  공간대여 검색 화면
TASK-028  공간대여 상세 (적합도 시각화)
TASK-029  user_filters 테이블 + UI
TASK-030  알림 발송 워커 (매일 오전 8시)
TASK-031  이메일 발송 (HTML 템플릿)
TASK-032  카카오 알림톡 연동
TASK-033  PWA manifest + service worker
TASK-034  반응형 최적화 검수
TASK-035  성능 최적화 (이미지 최적화/번들 분석)
TASK-036  배포 및 도메인 연결
```

---

## 10. 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| 법원경매 사이트 구조 변경 | 높음 | 셀렉터 모듈화, 변경 감지 알림, 빠른 패치 절차 |
| 네이버부동산 단건 파싱 차단 | 중간 | User-Agent 회전, Captcha 발생 시 사용자에게 안내 |
| 국토부 API 호출 한도 | 낮음 | 일별 1만건 제한 → 캐싱, 필요 시 추가 키 발급 |
| Claude API 비용 증가 | 중간 | Haiku 우선, Sonnet은 핵심 기능에만, 결과 캐싱 |
| 사용자 인증 분리 vs BBK 통합 | 중간 | Phase 0에서 결정 — BBK SSO 권장 (사용자 1명) |
| Vercel Serverless 시간 제한 | 낮음 | 크롤링은 GitHub Actions/별도 VPS, API는 단순 조회만 |
| 데이터 정확성 (실거래 vs 호가) | 중간 | 시세 분석에 출처 명시, 사용자 검증 책임 |
| 모바일 PWA iOS 푸시 한계 | 중간 | iOS 16.4+ 지원, 미지원 시 이메일 fallback |

---

## 11. 비용 구조 (월간 예상)

| 항목 | 비용 |
|------|------|
| Vercel | 무료 (Hobby) → 트래픽 늘면 Pro $20 |
| Supabase | 무료 (BBK 공유) |
| GitHub Actions | 무료 (월 2,000분 한도 내) |
| 국토부 공공API | 무료 |
| 카카오맵 API | 무료 (월 30만 건 무료) |
| 카카오 로컬 API | 무료 (월 30만 건) |
| Claude API | $5~30 (분석량에 따라) |
| 도메인 | 연 1.5만원 (.com) |
| **총** | **월 약 1~3만원** |

수익화 시 (구독제 도입 검토): 월 9,900원 / 19,900원 / 39,900원 티어

---

## 12. 향후 확장 (V2 이후)

- **AI 챗봇**: "강남에서 ROI 8% 이상 매물 찾아줘" 자연어 검색
- **포트폴리오 관리**: 보유 부동산 통합 관리 + 자산 그래프
- **세금 시뮬레이터**: 양도세/종부세 자동 계산
- **다른 사용자 비교**: 익명화된 평균 ROI / 인기 지역
- **부동산 전문가 매칭**: 권리분석 의뢰, 현장 임장 대행
- **블록체인/STO**: 부동산 토큰화 매물 (장기)
- **글로벌 확장**: 일본 부동산 경매, 동남아 매물

---

## 13. 협업 모델 (Opus 계획 + Sonnet 구현)

### 역할 분담

| 단계 | 모델 | 산출물 |
|------|------|------|
| 비전/전략/아키텍처 결정 | **Opus 4.7** | 본 문서, ADR (Architecture Decision Record) |
| Task 분해 및 인터페이스 설계 | **Opus 4.7** | TASK 명세, 타입 정의, API 스펙 |
| 코드 구현 | **Sonnet 4.6** | 실제 .ts/.tsx 파일 |
| 코드 리뷰 | **code-reviewer 서브에이전트** (Sonnet) | 품질/보안 점검 |
| 디버깅 (단순) | **Sonnet 4.6** | 버그 픽스 |
| 디버깅 (복잡한 아키텍처 이슈) | **Opus 4.7** | 근본 원인 분석 |
| 문서 정리 | **Sonnet 4.6** | README, DEVLOG 업데이트 |

### 작업 흐름 예시

1. 사용자: "Phase 1 경매 트랙 시작하자"
2. **Opus**: 본 문서의 TASK-006~010을 세부 명세 (테이블 컬럼, API 시그니처, 화면 컴포넌트 트리)로 풀어줌
3. 사용자: "OK, 진행해"
4. **Sonnet**: 명세대로 구현 (코드 작성)
5. 자동: code-reviewer가 즉시 검토
6. 사용자: 화면 확인 후 피드백
7. **Sonnet**: 피드백 반영
8. **Opus**: Phase 1 완료 검수, Phase 2 명세

---

## 14. 확정된 결정사항 (2026-04-30 사용자 결정)

| 의사결정 | 확정안 | 비고 |
|---------|--------|------|
| 프로젝트 위치 | **`BBK-Workspace/real-estate-app/`** 신규 디렉토리 | BBK 앱과 완전 분리, 새 GitHub 저장소 |
| 인증 시스템 | **Supabase Auth 별도 계정** | 이메일/비밀번호 + 매직링크, RLS 적용 |
| Supabase 프로젝트 | **신규 프로젝트 생성** | BBK와 분리, 이름: `reia` 권장 |
| 사용자 범위 | **본인 + 가족** (2~5명) | 멀티유저 RLS 필요, 결제 모듈 불필요 |
| 구현 순서 | **Phase 1 → 2 → 3 → 4 → 5 순차** | 경매(Phase1) → 수익성(Phase2) → 매매/전월세(Phase3) → 공간대여(Phase4) → 알림/PWA(Phase5) |
| 데이터 정책 | **URL 붙여넣기 OK + 공간대여 시세수집 OK** | 단건 파싱, 합법 범위 내 |
| 수익화 | **무료, 가족 사용 한정** | 결제/구독 미구현 |

### 즉시 진행 사항
1. ✅ Phase 1 상세 명세서 작성 (`PHASE-1-SPEC.md` — 본 문서 옆에 생성)
2. 사용자: Supabase 신규 프로젝트 생성 + URL/Service Key 공유
3. 사용자: GitHub 신규 저장소 생성 (`reia` 또는 원하는 이름)
4. Sonnet이 TASK-001부터 순차 구현 시작

---

## 부록 A: 참고 자료

| 분류 | 출처 |
|------|------|
| 법원경매 | https://www.courtauction.go.kr |
| 국토부 실거래가 | https://www.data.go.kr (검색: 아파트 실거래가) |
| 카카오 디벨로퍼 | https://developers.kakao.com |
| 한국관광공사 API | https://www.data.go.kr (한국관광공사) |
| KOSIS 통계 | https://kosis.kr/openapi |
| Next.js 14 App Router | https://nextjs.org/docs/app |
| Supabase | https://supabase.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Pretendard | https://github.com/orioncactus/pretendard |

## 부록 B: 관련 기존 자산

| 자산 | 위치 | 활용 방안 |
|------|------|----------|
| auction-crawler | `BBK-Workspace/auction-crawler/` | 그대로 워커로 통합, 데이터 흐름은 properties 테이블로 |
| BBK 앱 디자인 시스템 | `bbk-app/src/components/ui/` | Tailwind 토큰 / 컴포넌트 재활용 |
| BBK Supabase 프로젝트 | `andmmbxhtufwvtsgdhti.supabase.co` | 신규 테이블만 추가 |
| 카카오 알림톡 인프라 | BBK 앱 webhooks | 알림 발송에 재활용 |
| Gmail 발송 셋업 | `auction-crawler/src/reporter.js` | 이메일 알림에 재활용 |

---

**끝.** 이 문서는 살아있는 문서로, Phase 진행에 따라 업데이트됩니다.
