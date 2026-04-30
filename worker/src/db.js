const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
    source_id: item.caseNumber,
    case_number: item.caseNumber,
    court: item.court,
    division: item.division,
    property_type: item.itemType,
    address: item.address,
    price_main: item.appraisalAmount,
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

    const { error } = await supabase
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

    if (error) console.warn(`⚠️ 분석 저장 실패 (${item.caseNumber}):`, error.message);
  }
  console.log(`💾 분석 결과 저장 완료: ${items.length}건`);
}

module.exports = { filterNewItems, saveItems, saveAnalysis };
