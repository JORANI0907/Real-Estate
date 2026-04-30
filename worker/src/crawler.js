const { chromium } = require('playwright');
const config = require('./config');

const BASE_URL = 'https://www.courtauction.go.kr';

// 검색 조건을 폼에 적용
async function applySearchConditions(page) {
  // 1. 지역 선택
  if (config.searchBy === 'address' && config.sido) {
    await page.getByText('소재지(지번주소)').click();
    await page.waitForTimeout(500);
    const sidoSelect = page.getByLabel('시도 선택');
    if (await sidoSelect.count() > 0) {
      await sidoSelect.selectOption(config.sido);
      await page.waitForTimeout(300);
    }
    if (config.sigungu) {
      const sigunguSelect = page.getByLabel('시군구 선택');
      if (await sigunguSelect.count() > 0) {
        await sigunguSelect.selectOption(config.sigungu);
        await page.waitForTimeout(300);
      }
    }
  } else {
    // 법원 기준 검색 (기본)
    if (config.court) {
      await page.getByLabel('법원 선택').selectOption(config.court);
      await page.waitForTimeout(300);
    }
    if (config.division) {
      await page.getByLabel('담당계 선택').selectOption(config.division);
    }
  }

  // 2. 용도 선택 (dispatchEvent로 연계 드롭다운 강제 업데이트)
  if (config.majorCategory) {
    await page.evaluate((val) => {
      const el = document.querySelector('[title="대분류 선택"]');
      if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
    }, config.majorCategory);
    await page.waitForTimeout(800);

    if (config.midCategory) {
      await page.evaluate((val) => {
        const el = document.querySelector('[title="중분류 선택"]');
        if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
      }, config.midCategory);
      await page.waitForTimeout(600);

      if (config.minorCategory) {
        await page.evaluate((val) => {
          const el = document.querySelector('[title="소분류 선택"]');
          if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
        }, config.minorCategory);
        await page.waitForTimeout(300);
      }
    }
  }

  // 3. 감정평가액
  if (config.appraisalMin) {
    await page.getByLabel('감정평가액 최소금액 선택').selectOption(config.appraisalMin);
  }
  if (config.appraisalMax) {
    await page.getByLabel('감정평가액 최대금액 선택').selectOption(config.appraisalMax);
  }

  // 4. 최저매각가격
  if (config.minBidMin) {
    await page.getByLabel('최저매각가격 최소금액 선택').selectOption(config.minBidMin);
  }
  if (config.minBidMax) {
    await page.getByLabel('최저매각가격 최대금액 선택').selectOption(config.minBidMax);
  }

  // 5. 면적
  if (config.areaMin) {
    await page.getByLabel('면적 최소 크기 입력').fill(config.areaMin);
  }
  if (config.areaMax) {
    await page.getByLabel('면적 최대 크기 입력').fill(config.areaMax);
  }

  // 6. 유찰횟수
  if (config.failCountMin) {
    await page.getByLabel('유찰횟수 최소 선택').selectOption(config.failCountMin);
  }
  if (config.failCountMax) {
    await page.getByLabel('유찰횟수 최대 선택').selectOption(config.failCountMax);
  }

  // 7. 최저매각가율
  if (config.bidRateMax) {
    await page.getByLabel('최저매각가율 최대 선택').selectOption(config.bidRateMax);
  }
}

// 목록 페이지에서 물건 데이터 파싱
async function parseListPage(page) {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll('table tr');
    const items = [];
    let i = 0;

    while (i < rows.length) {
      const cells = rows[i].querySelectorAll('td');
      if (cells.length >= 6) {
        // 첫 번째 행: 사건번호, 물건번호, 소재지, 감정평가액, 담당계, 매각기일
        const courtAndCase = cells[0]?.textContent.trim() || '';
        const courtMatch = courtAndCase.match(/(.+법원|.+지원)/);
        const caseMatch = courtAndCase.match(/(\d{4}타경\d+)/);

        const addressCell = cells[3];
        const addressLink = addressCell?.querySelector('a');
        const onclickAttr = addressLink?.getAttribute('onclick') || '';
        const indexMatch = onclickAttr.match(/moveDtlPage\((\d+)\)/);

        // cells[4]=지도버튼, cells[5]=비고, cells[6]=감정평가액, cells[7]=담당계+매각기일(br구분)
        const appraisal = cells[6]?.textContent.replace(/[^0-9]/g, '') || '0';
        // cells[7]: <text id="toolText*">경매4계</text><br>2026.05.06 — innerText가 br을 \n으로 변환
        const col7Parts = (cells[7]?.innerText || '').split('\n').map(s => s.trim()).filter(s => s);
        const division = col7Parts[0] || '';
        const bidDate = col7Parts[1] || '';

        // 두 번째 행: 용도, 최저매각가격(%), 유찰횟수
        const nextRow = rows[i + 1];
        const nextCells = nextRow?.querySelectorAll('td') || [];
        const itemType = nextCells[0]?.textContent.trim() || '';
        const minBidRaw = nextCells[1]?.textContent.trim() || '';
        const minBidMatch = minBidRaw.match(/([\d,]+)\s*\((\d+)%\)/);
        const failInfo = nextCells[2]?.textContent.trim() || '';
        const failMatch = failInfo.match(/(\d+)회/);

        if (caseMatch) {
          items.push({
            court: courtMatch ? courtMatch[1] : '',
            caseNumber: caseMatch[1],
            itemIndex: indexMatch ? parseInt(indexMatch[1]) : null,
            address: addressLink?.textContent.trim() || '',
            appraisalAmount: parseInt(appraisal) || 0,
            division,
            bidDate: bidDate.split(' ')[0],
            itemType,
            minBidAmount: minBidMatch ? parseInt(minBidMatch[1].replace(/,/g, '')) : 0,
            minBidRate: minBidMatch ? parseInt(minBidMatch[2]) : 0,
            failCount: failMatch ? parseInt(failMatch[1]) : 0,
          });
        }
        i += 2;
      } else {
        i++;
      }
    }
    return items;
  });
}

// 물건 상세 정보 수집 (moveDtlPage 호출 후)
async function fetchItemDetail(page, itemIndex) {
  await page.evaluate((idx) => moveDtlPage(idx), itemIndex);
  await page.waitForTimeout(1500);

  const detail = await page.evaluate(() => {
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    };

    // 기본정보 테이블
    const basicTable = document.querySelector(
      'table[summary*="사건번호,물건번호,물건종류"]'
    );
    let itemNote = '';
    if (basicTable) {
      const rows = basicTable.querySelectorAll('tr');
      rows.forEach(r => {
        const th = r.querySelector('th');
        const td = r.querySelector('td');
        if (th?.textContent.includes('물건비고')) {
          itemNote = td?.textContent.replace(/\s+/g, ' ').trim() || '';
        }
      });
    }

    // 감정평가요항표
    const appraisalSummary = (() => {
      const list = document.querySelectorAll('ul li');
      let text = '';
      list.forEach(li => {
        const t = li.textContent.replace(/\s+/g, ' ').trim();
        if (t.length > 5 && t.length < 500) text += t + '\n';
      });
      return text.substring(0, 2000);
    })();

    return { itemNote, appraisalSummary };
  });

  return detail;
}

// 사건상세조회에서 당사자 정보 수집
async function fetchCaseDetail(page) {
  // 사건상세조회 버튼 클릭
  const btn = page.locator('[id*="btn_moveCsDtl"]');
  if (await btn.count() === 0) return null;
  await btn.click();
  await page.waitForTimeout(1500);

  return await page.evaluate(() => {
    const panel = document.querySelector('[id*="tac_srchRsltDvs_contents_content1"]');
    if (!panel) return null;

    const parties = {};
    const partyTable = Array.from(panel.querySelectorAll('table')).find(t =>
      t.querySelector('caption')?.textContent.includes('당사자구분')
    );

    if (partyTable) {
      const rows = partyTable.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const type1 = cells[0]?.textContent.trim();
          const name1 = cells[1]?.textContent.trim();
          const type2 = cells[2]?.textContent.trim();
          const name2 = cells[3]?.textContent.trim();
          if (type1) parties[type1] = (parties[type1] || []).concat(name1);
          if (type2) parties[type2] = (parties[type2] || []).concat(name2);
        }
      });
    }

    // 사건기본정보
    const basicInfo = {};
    const tables = panel.querySelectorAll('table');
    tables.forEach(t => {
      const caption = t.querySelector('caption')?.textContent || '';
      if (caption.includes('사건번호,사건명')) {
        t.querySelectorAll('tr').forEach(row => {
          const text = row.textContent.replace(/\s+/g, ' ').trim();
          if (text.includes('청구금액')) {
            const m = text.match(/청구금액([\d,]+)원/);
            if (m) basicInfo.claimAmount = parseInt(m[1].replace(/,/g, ''));
          }
        });
      }
    });

    return { parties, basicInfo };
  });
}

// 메인 크롤링 함수
async function crawl() {
  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage();
  const allItems = [];

  try {
    console.log('🔍 법원경매 사이트 접속 중...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 물건상세검색 이동
    await page.getByTitle('물건상세검색 바로가기').click();
    await page.waitForTimeout(1500);

    // 검색 조건 적용
    console.log('⚙️ 검색 조건 설정 중...');
    await applySearchConditions(page);
    await page.waitForTimeout(500);

    // 검색 실행
    await page.getByRole('button', { name: '검색', exact: true }).click();
    await page.waitForTimeout(2000);

    // 총 건수 확인 (caption 기반 파싱)
    const totalText = await page.evaluate(() => document.body.innerText);
    const totalMatch = totalText.match(/총 물건수\s*([\d,]+)건/);
    const totalCount = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;
    console.log(`📋 검색 결과: 총 ${totalCount}건 (페이지 텍스트 파싱)`);

    // 페이지별 수집
    for (let p = 1; p <= config.maxPages; p++) {
      console.log(`📄 ${p}/${config.maxPages} 페이지 수집 중...`);
      const pageItems = await parseListPage(page);
      console.log(`  → ${pageItems.length}건 파싱`);

      // 각 물건 상세 수집
      for (const item of pageItems) {
        if (item.itemIndex === null) continue;
        try {
          const detail = await fetchItemDetail(page, item.itemIndex);
          item.itemNote = detail.itemNote;
          item.appraisalSummary = detail.appraisalSummary;

          const caseDetail = await fetchCaseDetail(page);
          if (caseDetail) {
            item.parties = caseDetail.parties;
            item.claimAmount = caseDetail.basicInfo?.claimAmount || 0;
          }

          // 뒤로가기 (목록 복원)
          await page.evaluate(() => {
            const backBtn = document.querySelector('[id*="btn_goBack"], [id*="btn_prev"]');
            if (backBtn) backBtn.click();
          });
          await page.waitForTimeout(config.delayMs);
          allItems.push(item);
        } catch (err) {
          console.warn(`  ⚠️ 상세 수집 실패 (${item.caseNumber}):`, err.message);
        }
      }

      // 다음 페이지
      if (p < config.maxPages) {
        const hasNext = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent.trim() === '다음 목록'
          );
          return btn && !btn.disabled;
        });
        if (!hasNext) break;

        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(
            b => b.textContent.trim() === '다음 목록'
          );
          if (btn) btn.click();
        });
        await page.waitForTimeout(2000);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`✅ 크롤링 완료: 총 ${allItems.length}건`);
  return allItems;
}

module.exports = { crawl };
