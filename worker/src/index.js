require('dotenv').config();

// 필수 환경변수 사전 검증
const REQUIRED_ENVS = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'ANTHROPIC_API_KEY'];
const missing = REQUIRED_ENVS.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ 필수 환경변수 누락: ${missing.join(', ')}`);
  console.error('   GitHub Secrets → Settings → Secrets and variables → Actions 에서 확인하세요.');
  process.exit(1);
}

const config = require('./config');
const { crawl } = require('./crawler');
const { analyzeItems } = require('./analyzer');
const { filterNewItems, saveItems, saveAnalysis, getCrawlerConfig } = require('./db');
const { sendReport } = require('./reporter');

async function main() {
  const startTime = Date.now();
  console.log('🚀 경매 물건 탐색 시작:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

  // DB에서 크롤링 설정 로드 후 config 모듈에 덮어씀
  const dbConfig = await getCrawlerConfig();
  if (dbConfig) {
    Object.assign(config, dbConfig);
    const courtLabel = config.courts?.length > 0 ? config.courts.join(', ') : (config.court || '전체');
    const catLabel = config.minorCategories?.length > 0 ? config.minorCategories.join(', ') : (config.minorCategory || '전체');
    console.log(`⚙️ DB 크롤링 설정 적용: ${config.majorCategory} ${config.midCategory} [${catLabel}] | 법원: ${courtLabel}`);
  } else {
    console.log('⚙️ 기본 크롤링 설정 사용');
  }

  try {
    // Phase 1: 크롤링 (법원 × 소분류 조합 순회, caseNumber 기준 중복 제거)
    const targetCourts = config.courts?.length > 0 ? config.courts : [config.court || ''];
    const targetCategories = config.minorCategories?.length > 0 ? config.minorCategories : [config.minorCategory || ''];
    const seenCaseNumbers = new Set();
    const allCrawledItems = [];

    for (const court of targetCourts) {
      for (const minorCat of targetCategories) {
        config.court = court;
        config.minorCategory = minorCat;
        const items = await crawl();
        for (const item of items) {
          if (!seenCaseNumbers.has(item.caseNumber)) {
            seenCaseNumbers.add(item.caseNumber);
            allCrawledItems.push(item);
          }
        }
      }
    }

    const crawledItems = allCrawledItems;
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

    // Phase 6: 이메일 보고서 발송 (실패해도 전체 실패로 처리하지 않음)
    try {
      await sendReport(analyzedItems);
    } catch (emailErr) {
      console.warn('⚠️ 이메일 발송 실패 (크롤링/분석은 정상 완료):', emailErr.message);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ 전체 완료: ${elapsed}초`);
    console.log(`   크롤링: ${crawledItems.length}건 | 신규: ${newItems.length}건 | 분석: ${analyzedItems.length}건`);

  } catch (err) {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
  }
}

main();
