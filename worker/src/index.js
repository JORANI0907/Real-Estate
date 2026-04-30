require('dotenv').config();
const { crawl } = require('./crawler');
const { analyzeItems } = require('./analyzer');
const { filterNewItems, saveItems, saveAnalysis } = require('./db');
const { sendReport } = require('./reporter');

async function main() {
  const startTime = Date.now();
  console.log('🚀 경매 물건 탐색 시작:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

  try {
    // Phase 1: 크롤링
    const crawledItems = await crawl();
    if (crawledItems.length === 0) {
      console.log('✅ 검색 조건에 맞는 물건이 없습니다.');
      return;
    }

    // Phase 2: 신규 물건만 필터링 (DB 중복 제거)
    const newItems = await filterNewItems(crawledItems);
    console.log(`🆕 신규 물건: ${newItems.length}건 (전체 ${crawledItems.length}건 중)`);

    if (newItems.length === 0) {
      console.log('✅ 신규 물건 없음 — 종료');
      return;
    }

    // Phase 3: DB 저장
    await saveItems(newItems);

    // Phase 4: Claude Haiku 권리분석
    const analyzedItems = await analyzeItems(newItems);

    // Phase 5: 분석 결과 DB 저장
    await saveAnalysis(analyzedItems);

    // Phase 6: 이메일 보고서 발송
    await sendReport(analyzedItems);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ 전체 완료: ${elapsed}초`);
    console.log(`   크롤링: ${crawledItems.length}건 | 신규: ${newItems.length}건 | 분석: ${analyzedItems.length}건`);

  } catch (err) {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
  }
}

main();
