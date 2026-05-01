import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import type { PropertySolution } from '@/types/domain';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SOLUTION_PROMPT = `당신은 한국 부동산 경매 전문 컨설턴트입니다.
아래 물건의 권리분석 결과와 데이터를 바탕으로 낙찰을 위한 전략적 솔루션을 JSON 형식으로 제공하세요.

## 물건 데이터
{PROPERTY_DATA}

## 기존 권리분석 결과
{LEGAL_ANALYSIS}

## 출력 형식 (반드시 아래 JSON만 출력, 다른 텍스트 없이):
{
  "summary": "전체 솔루션 요약 (200자 이내)",
  "cost_detail": {
    "bid_price_estimate": 예상낙찰가_원,
    "acquisition_tax": 취득세_원,
    "registration_fee": 등록면허세_및_교육세_원,
    "judicial_scrivener": 법무사수수료_원,
    "stamp_duty": 인지대_원,
    "eviction_cost": 명도비용_원,
    "renovation_estimate": 수리비추정_원,
    "loan_setup_fee": 대출설정비_원,
    "other": 기타비용_원,
    "total": 총예상비용_원,
    "notes": "비용 산정 근거 및 주의사항 (100자 이내)"
  },
  "rights_solutions": [
    {
      "issue": "문제명 (20자 이내)",
      "severity": "high 또는 medium 또는 low",
      "description": "문제 설명 (100자 이내)",
      "solution": "해결 방법 (150자 이내)",
      "my_action": "내가 직접 해야 할 일 (100자 이내)"
    }
  ],
  "action_checklist": {
    "before_bid": ["입찰 전 할 일 (각 항목 50자 이내)"],
    "after_winning": ["낙찰 후 할 일 (각 항목 50자 이내)"],
    "before_registration": ["소유권이전등기 전 할 일"],
    "after_registration": ["소유권이전등기 후 할 일"]
  },
  "other_solutions": "명도 전략, 투자 전략, 주의사항 등 추가 조언 (300자 이내)"
}

## 비용 산정 기준
- 예상 낙찰가: 최저매각가격의 110~130% (유찰횟수가 많을수록 낮게, 경쟁 물건일수록 높게)
- 취득세: 아파트 1~3억 1.1%, 3~6억 2.2%, 6억 초과 3.3% (농어촌특별세 포함)
- 법무사 수수료: 물건가액의 약 0.1~0.2%
- 명도비용: 임차인 1인당 50~150만원, 소유자 거주 시 100~200만원
- 대출설정비: 대출금액의 0.2~0.4% 예상`;

function mapSolution(row: Record<string, unknown>): PropertySolution {
  const cd = (row.cost_detail as Record<string, unknown>) ?? {};
  const ac = (row.action_checklist as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    userId: row.user_id as string,
    summary: (row.summary as string) ?? '',
    costDetail: {
      bidPriceEstimate: (cd.bid_price_estimate as number) ?? 0,
      acquisitionTax: (cd.acquisition_tax as number) ?? 0,
      registrationFee: (cd.registration_fee as number) ?? 0,
      judicialScrivener: (cd.judicial_scrivener as number) ?? 0,
      stampDuty: (cd.stamp_duty as number) ?? 0,
      evictionCost: (cd.eviction_cost as number) ?? 0,
      renovationEstimate: (cd.renovation_estimate as number) ?? 0,
      loanSetupFee: (cd.loan_setup_fee as number) ?? 0,
      other: (cd.other as number) ?? 0,
      total: (cd.total as number) ?? 0,
      notes: (cd.notes as string) ?? '',
    },
    rightsSolutions: ((row.rights_solutions as unknown[]) ?? []).map((r) => {
      const rs = r as Record<string, unknown>;
      return {
        issue: (rs.issue as string) ?? '',
        severity: (rs.severity as 'high' | 'medium' | 'low') ?? 'low',
        description: (rs.description as string) ?? '',
        solution: (rs.solution as string) ?? '',
        myAction: (rs.my_action as string) ?? '',
      };
    }),
    actionChecklist: {
      beforeBid: (ac.before_bid as string[]) ?? [],
      afterWinning: (ac.after_winning as string[]) ?? [],
      beforeRegistration: (ac.before_registration as string[]) ?? [],
      afterRegistration: (ac.after_registration as string[]) ?? [],
    },
    otherSolutions: (row.other_solutions as string) ?? '',
    createdAt: row.created_at as string,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('property_solutions')
    .select('*')
    .eq('property_id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ solution: null });
  return NextResponse.json({ solution: mapSolution(data as Record<string, unknown>) });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: raw, error: propErr } = await supabase
    .from('properties')
    .select('*, legal_analysis(*)')
    .eq('id', id)
    .single();

  if (propErr || !raw) return NextResponse.json({ error: '물건 정보를 찾을 수 없습니다' }, { status: 404 });

  const legalRaw = Array.isArray(raw.legal_analysis)
    ? raw.legal_analysis[0]
    : raw.legal_analysis;

  const propertyData = JSON.stringify({
    사건번호: raw.case_number,
    법원: raw.court,
    소재지: raw.address,
    물건종류: raw.property_type,
    감정평가액: raw.price_main,
    최저매각가격: raw.price_min_bid,
    최저매각가율: `${raw.min_bid_rate}%`,
    유찰횟수: `${raw.fail_count}회`,
    매각기일: raw.bid_date,
    청구금액: raw.claim_amount,
    물건비고: raw.item_note?.substring(0, 500),
    당사자정보: raw.parties,
    감정평가요항: raw.appraisal_summary?.substring(0, 800),
  }, null, 2);

  const legalData = legalRaw ? JSON.stringify({
    위험도: legalRaw.risk_level,
    위험요약: legalRaw.risk_summary,
    말소기준권리: legalRaw.liquidation_reference_right,
    인수되는권리: legalRaw.inherited_rights,
    임차인위험: legalRaw.lessee_risk,
    유치권위험: legalRaw.lien_risk,
    법정지상권: legalRaw.legal_ground_right,
    예상취득비용: legalRaw.estimated_total_cost,
    투자메모: legalRaw.investment_memo,
  }, null, 2) : '권리분석 데이터 없음';

  const prompt = SOLUTION_PROMPT
    .replace('{PROPERTY_DATA}', propertyData)
    .replace('{LEGAL_ANALYSIS}', legalData);

  let parsed: Record<string, unknown>;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    return NextResponse.json(
      { error: 'AI 분석 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류') },
      { status: 500 }
    );
  }

  const { data: saved, error: saveErr } = await supabase
    .from('property_solutions')
    .upsert({
      property_id: id,
      user_id: user.id,
      summary: (parsed.summary as string) ?? '',
      cost_detail: parsed.cost_detail ?? {},
      rights_solutions: parsed.rights_solutions ?? [],
      action_checklist: parsed.action_checklist ?? {},
      other_solutions: (parsed.other_solutions as string) ?? '',
      raw_solution: parsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'property_id,user_id' })
    .select()
    .single();

  if (saveErr || !saved) {
    return NextResponse.json({ error: '저장 실패: ' + saveErr?.message }, { status: 500 });
  }

  return NextResponse.json({ solution: mapSolution(saved as Record<string, unknown>) });
}
