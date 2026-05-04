-- crawler_config에 자동 크롤링 제어 컬럼 추가
ALTER TABLE crawler_config
  ADD COLUMN IF NOT EXISTS auto_crawl_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS make_manual_webhook_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS make_auto_scenario_id integer;

-- 크롤링 날짜별 집계 뷰
CREATE OR REPLACE VIEW v_crawl_dates AS
  SELECT
    DATE(crawled_at AT TIME ZONE 'Asia/Seoul') AS crawl_date,
    COUNT(*)::integer AS cnt
  FROM properties
  WHERE source = 'auction'
  GROUP BY crawl_date
  ORDER BY crawl_date DESC;
