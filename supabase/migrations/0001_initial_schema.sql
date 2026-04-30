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
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id               uuid UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  risk_level                text CHECK (risk_level IN ('상','중','하','분석실패')),
  risk_summary              text,
  liquidation_reference_right text,
  inherited_rights          jsonb DEFAULT '[]'::jsonb,
  lessee_risk               jsonb DEFAULT '{}'::jsonb,
  lien_risk                 jsonb DEFAULT '{}'::jsonb,
  legal_ground_right        jsonb DEFAULT '{}'::jsonb,
  estimated_total_cost      bigint DEFAULT 0,
  cost_breakdown            jsonb DEFAULT '{}'::jsonb,
  investment_memo           text,
  raw_analysis              text,
  analyzed_at               timestamptz DEFAULT now()
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

-- 4) 통합 뷰 (경매 목록 조회용)
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
