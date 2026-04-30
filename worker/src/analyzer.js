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
  "investment_memo": "투자 관점 한줄 메모 (최대 150자)"
}

## 분석 기준
- 말소기준권리: 압류·가압류·담보물권 중 가장 빠른 것
- 위험도 '상': 유치권 신고 or 선순위 임차인 대항력 있음 or 법정지상권 or 인수 권리 있음
- 위험도 '중': 임차인 있으나 배당 가능 or 가압류 다수
- 위험도 '하': 명도 용이, 인수 권리 없음
- 예상 낙찰가: 최저매각가격의 110~130% 추정
- 취득세: 아파트 1~3억 1.1%, 3~6억 2.2%, 6억초과 3.3%
- 명도비용: 임차인 1인당 약 100만원 예상`;

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
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;

  // JSON 추출 (마크다운 코드블록 제거)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패: ' + text.substring(0, 100));

  return JSON.parse(jsonMatch[0]);
}

async function analyzeItems(items) {
  const results = [];
  console.log(`🤖 Claude Haiku 권리분석 시작: ${items.length}건`);

  for (const item of items) {
    try {
      console.log(`  분석 중: ${item.caseNumber} (${item.address?.substring(0, 30)}...)`);
      const analysis = await analyzeItem(item);
      results.push({ ...item, analysis });

      // API 속도 제한 방지
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
      });
    }
  }

  console.log(`✅ 권리분석 완료: ${results.length}건`);
  return results;
}

module.exports = { analyzeItems };
