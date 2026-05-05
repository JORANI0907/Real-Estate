const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_PROMPT = `당신은 한국 부동산 경매 권리분석 전문가입니다.
아래 경매 물건 정보를 분석하여 JSON 형식으로 결과를 반환하세요.

## 분석 대상 데이터
{DATA}

## 분석 항목 및 출력 형식 (반드시 아래 JSON만 출력)
{
  "risk_level": "상|중|하",
  "risk_summary": "한 줄 요약 (최대 100자)",
  "liquidation_reference_right": "말소기준권리 설명",
  "inherited_rights": ["인수되는 권리 목록 (없으면 빈 배열)"],
  "lessee_risk": {
    "has_lessee": true|false,
    "priority_lessee": true|false,
    "description": "임차인 위험 설명"
  },
  "lien_risk": {
    "has_lien": true|false,
    "description": "유치권 위험 설명"
  },
  "legal_ground_right": {
    "exists": true|false,
    "description": "법정지상권 설명"
  },
  "estimated_total_cost": 예상_총취득비용_원_단위_숫자,
  "cost_breakdown": {
    "bid_price_estimate": 예상낙찰가_원,
    "acquisition_tax": 취득세_원,
    "eviction_cost": 명도비용_원,
    "other": 기타비용_원
  },
  "investment_memo": "아래 형식으로 작성:\n[입찰 전 확인사항]\n1. ...\n2. ...\n[입찰 전략]\n...\n[낙찰 후 처리 계획]\n1. ...\n2. ..."
}

## 분석 기준
- 말소기준권리: 압류·가압류·담보물권 중 가장 빠른 것
- 위험도 '상': 유치권 신고 or 선순위 임차인 대항력 있음 or 법정지상권 or 인수 권리 있음
- 위험도 '중': 임차인 있으나 배당 가능 or 가압류 다수
- 위험도 '하': 명도 용이, 인수 권리 없음
- 예상 낙찰가: 최저매각가격의 110~130% 추정
- 취득세: 아파트 1~3억 1.1%, 3~6억 2.2%, 6억초과 3.3%
- 명도비용: 임차인 1인당 약 100만원 예상

## investment_memo 작성 지침
이 물건의 실제 낙찰을 목표로 하는 초보 투자자를 위한 실행 가능한 단계별 솔루션을 작성한다.
- [입찰 전 확인사항]: 현장 방문, 등기부등본 확인, 임차인 면담, 법적 검토 등 실제로 해야 할 행동 목록
- [입찰 전략]: 적정 입찰가 범위, 경쟁 강도 예측, 입찰 시 주의사항
- [낙찰 후 처리 계획]: 명도 절차, 잔금 납부, 소유권 이전, 수익화 방안 등 순서대로
각 섹션 항목은 번호 목록으로 구체적으로 작성. 전체 500자 이내.`;

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

## 분석 지침
- 위치 분석: 주소의 시·군·구·동 정보를 기반으로 교통(지하철·버스), 학군, 편의시설, 재개발 등 추론
- 물건 특수성: 물건 종류, 감정가 대비 최저가 할인율, 물건비고 내용, 유찰횟수가 의미하는 바
- 권리별 해결: 권리분석 결과의 위험 항목마다 실제 해결 가능한 방법 작성 (문제 없으면 빈 배열)
- 비용: 최저매각가의 110~130%, 취득세 1.1~3.3%, 법무사 0.1~0.2%, 명도 인당 100만원
- 체크리스트: 구체적이고 실행 가능한 항목으로 작성

## 출력 규칙 (반드시 준수)
- 모든 문자열 값 내부에 줄바꿈(\\n) 절대 금지 — 한 줄로만 작성
- JSON 외 다른 텍스트 출력 금지
- 숫자 필드는 반드시 숫자(따옴표 없음)`;

async function analyzeItem(item) {
  const data = JSON.stringify({
    사건번호: item.caseNumber,
    법원: item.court,
    담당계: item.division,
    소재지: item.address,
    물건종류: item.itemType,
    감정평가액: item.appraisalAmount,
    최저매각가격: item.minBidAmount,
    최저매각가율: `${item.minBidRate}%`,
    유찰횟수: `${item.failCount}회`,
    매각기일: item.bidDate,
    청구금액: item.claimAmount,
    물건비고: item.itemNote,
    당사자정보: item.parties,
    감정평가요항: item.appraisalSummary?.substring(0, 1000),
  }, null, 2);

  const prompt = ANALYSIS_PROMPT.replace('{DATA}', data);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패: ' + text.substring(0, 100));

  return JSON.parse(jsonMatch[0]);
}

function safeParseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON 블록을 찾을 수 없음: ' + text.substring(0, 100));

  const raw = match[0];
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch === '\n') { result += '\\n'; continue; }
    if (inString && ch === '\r') continue;
    if (inString && ch === '\t') { result += ' '; continue; }

    result += ch;
  }

  return JSON.parse(result);
}

async function generateSolution(item, analysis) {
  const propertyData = JSON.stringify({
    사건번호: item.caseNumber,
    법원: item.court,
    소재지: item.address,
    물건종류: item.itemType,
    감정평가액: item.appraisalAmount,
    최저매각가격: item.minBidAmount,
    최저매각가율: `${item.minBidRate}%`,
    유찰횟수: `${item.failCount}회`,
    매각기일: item.bidDate,
    청구금액: item.claimAmount,
    물건비고: item.itemNote?.substring(0, 500),
    당사자정보: item.parties,
    감정평가요항: item.appraisalSummary?.substring(0, 800),
  }, null, 2);

  const legalData = JSON.stringify({
    위험도: analysis.risk_level,
    위험요약: analysis.risk_summary,
    말소기준권리: analysis.liquidation_reference_right,
    인수되는권리: analysis.inherited_rights,
    임차인위험: analysis.lessee_risk,
    유치권위험: analysis.lien_risk,
    법정지상권: analysis.legal_ground_right,
    예상취득비용: analysis.estimated_total_cost,
  }, null, 2);

  const prompt = SOLUTION_PROMPT
    .replace('{PROPERTY_DATA}', propertyData)
    .replace('{LEGAL_ANALYSIS}', legalData);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  return safeParseJson(text);
}

async function analyzeItems(items) {
  const results = [];
  console.log(`🤖 Claude Haiku 권리분석 시작: ${items.length}건`);

  for (const item of items) {
    try {
      console.log(`  분석 중: ${item.caseNumber} (${item.address?.substring(0, 30)}...)`);
      const analysis = await analyzeItem(item);

      await new Promise(r => setTimeout(r, 300));

      console.log(`  솔루션 생성 중: ${item.caseNumber}`);
      let solution = null;
      try {
        solution = await generateSolution(item, analysis);
      } catch (solErr) {
        console.warn(`  ⚠️ 솔루션 생성 실패 (${item.caseNumber}):`, solErr.message);
      }

      results.push({ ...item, analysis, solution });

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`  ⚠️ 분석 실패 (${item.caseNumber}):`, err.message);
      results.push({
        ...item,
        analysis: {
          risk_level: '분석실패',
          risk_summary: err.message,
          inherited_rights: [],
          lessee_risk: { has_lessee: false },
          lien_risk: { has_lien: false },
          legal_ground_right: { exists: false },
          estimated_total_cost: 0,
          investment_memo: '분석 중 오류 발생',
        },
        solution: null,
      });
    }
  }

  console.log(`✅ 권리분석 + 솔루션 생성 완료: ${results.length}건`);
  return results;
}

module.exports = { analyzeItems };
