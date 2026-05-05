require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SOLUTION_PROMPT = `당신은 한국 부동산 경매 전문 컨설턴트입니다.
아래 물건 데이터와 권리분석 결과를 바탕으로 종합 솔루션을 JSON 형식으로 제공하세요.

## 물건 데이터
{PROPERTY_DATA}

## 권리분석 결과
{LEGAL_ANALYSIS}

## 출력 형식 (반드시 아래 JSON만 출력, 다른 텍스트 없이):
{
  "location_analysis": {
    "summary": "위치 분석 요약 (150자 이내) — 교통, 학군, 생활 인프라, 개발 호재 등",
    "pros": ["장점 항목 (각 40자 이내)", "..."],
    "cons": ["단점 항목 (각 40자 이내)", "..."]
  },
  "property_characteristics": {
    "summary": "물건 특수성 요약 (150자 이내) — 감정가 대비 매력도, 주목할 특이사항",
    "points": ["특이사항 항목 (각 50자 이내)", "..."]
  },
  "rights_solutions": [
    {
      "issue": "문제명 (20자 이내)",
      "severity": "high 또는 medium 또는 low",
      "description": "문제 설명 (80자 이내)",
      "solution": "해결 방법 (120자 이내)",
      "my_action": "내가 직접 해야 할 일 (80자 이내)"
    }
  ],
  "cost_detail": {
    "bid_price_estimate": 예상낙찰가_원,
    "acquisition_tax": 취득세_원,
    "registration_fee": 등록면허세_및_교육세_원,
    "judicial_scrivener": 법무사수수료_원,
    "eviction_cost": 명도비용_원,
    "renovation_estimate": 수리비추정_원,
    "other": 기타비용_원,
    "total": 총예상비용_원,
    "notes": "비용 산정 근거 (80자 이내)"
  },
  "action_checklist": {
    "before_bid": ["입찰 전 할 일 (각 항목 50자 이내, 최소 3개)"],
    "after_winning": ["낙찰 후 할 일 (각 항목 50자 이내, 최소 3개)"],
    "before_registration": ["소유권이전등기 전 할 일"],
    "after_registration": ["소유권이전등기 후 할 일"]
  },
  "investment_opinion": "투자 종합 의견 (250자 이내) — 리스크 수준, 예상 수익성, 추천 입찰가, 주요 주의사항"
}

## 출력 규칙 (반드시 준수)
- 모든 문자열 값 내부에 줄바꿈(\\n) 절대 금지 — 한 줄로만 작성
- JSON 외 다른 텍스트 출력 금지
- 숫자 필드는 반드시 숫자(따옴표 없음)`;

function safeParseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON 블록을 찾을 수 없음');

  const raw = match[0];
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && ch === '\n') { result += '\\n'; continue; }
    if (inString && ch === '\r') continue;
    if (inString && ch === '\t') { result += ' '; continue; }

    result += ch;
  }

  return JSON.parse(result);
}

async function main() {
  const { data: rows, error } = await supabase
    .from('legal_analysis')
    .select('id, property_id, risk_level, risk_summary, liquidation_reference_right, inherited_rights, lessee_risk, lien_risk, legal_ground_right, estimated_total_cost')
    .is('auto_solution', null);

  if (error) { console.error('DB 조회 실패:', error.message); process.exit(1); }
  if (!rows?.length) { console.log('재처리할 물건 없음'); return; }

  console.log(`🔄 솔루션 재생성: ${rows.length}건`);

  for (const la of rows) {
    const { data: prop } = await supabase
      .from('properties')
      .select('case_number, court, address, property_type, price_main, price_min_bid, min_bid_rate, fail_count, bid_date, claim_amount, item_note, parties, appraisal_summary')
      .eq('id', la.property_id)
      .single();

    if (!prop) { console.warn(`  ⚠️ 물건 정보 없음 (${la.property_id})`); continue; }

    const propertyData = JSON.stringify({
      사건번호: prop.case_number,
      법원: prop.court,
      소재지: prop.address,
      물건종류: prop.property_type,
      감정평가액: prop.price_main,
      최저매각가격: prop.price_min_bid,
      최저매각가율: `${prop.min_bid_rate}%`,
      유찰횟수: `${prop.fail_count}회`,
      매각기일: prop.bid_date,
      청구금액: prop.claim_amount,
      물건비고: prop.item_note?.substring(0, 500),
      감정평가요항: prop.appraisal_summary?.substring(0, 800),
    }, null, 2);

    const legalData = JSON.stringify({
      위험도: la.risk_level,
      위험요약: la.risk_summary,
      말소기준권리: la.liquidation_reference_right,
      인수되는권리: la.inherited_rights,
      임차인위험: la.lessee_risk,
      유치권위험: la.lien_risk,
      법정지상권: la.legal_ground_right,
      예상취득비용: la.estimated_total_cost,
    }, null, 2);

    try {
      console.log(`  생성 중: ${prop.case_number} (${prop.address?.substring(0, 30)}...)`);

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: SOLUTION_PROMPT.replace('{PROPERTY_DATA}', propertyData).replace('{LEGAL_ANALYSIS}', legalData) }],
      });

      const solution = safeParseJson(response.content[0].text);

      const { error: upErr } = await supabase
        .from('legal_analysis')
        .update({ auto_solution: solution })
        .eq('id', la.id);

      if (upErr) console.warn(`  ⚠️ 저장 실패 (${prop.case_number}):`, upErr.message);
      else console.log(`  ✅ 완료: ${prop.case_number}`);
    } catch (err) {
      console.warn(`  ❌ 실패 (${prop.case_number}):`, err.message);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log('✅ 재처리 완료');
}

main().catch(console.error);
