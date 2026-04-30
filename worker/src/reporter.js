const nodemailer = require('nodemailer');
const config = require('./config');

function formatAmount(n) {
  if (!n || n === 0) return '-';
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}

function riskBadge(level) {
  const map = { '상': '🔴', '중': '🟡', '하': '🟢', '분석실패': '⚪' };
  return map[level] || '⚪';
}

function buildHtmlReport(items, date) {
  const totalCount = items.length;
  const lowRiskCount = items.filter(i => i.analysis?.risk_level === '하').length;
  const midRiskCount = items.filter(i => i.analysis?.risk_level === '중').length;
  const highRiskCount = items.filter(i => i.analysis?.risk_level === '상').length;

  const itemRows = items
    .sort((a, b) => {
      const order = { '하': 0, '중': 1, '상': 2, '분석실패': 3 };
      return (order[a.analysis?.risk_level] ?? 3) - (order[b.analysis?.risk_level] ?? 3);
    })
    .map(item => {
      const a = item.analysis || {};
      const courtUrl = `https://www.courtauction.go.kr`;
      const inheritedRights = (a.inherited_rights || []).join(', ') || '없음';
      const lessee = a.lessee_risk?.has_lessee
        ? `⚠️ ${a.lessee_risk.description || '임차인 있음'}`
        : '없음';
      const lien = a.lien_risk?.has_lien ? `⚠️ ${a.lien_risk.description || '유치권'}` : '없음';

      return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 8px; font-weight: bold; color: #1a1a2e;">
          ${riskBadge(a.risk_level)} <span style="font-size:11px; color:#666;">${item.court}<br></span>
          ${item.caseNumber}
        </td>
        <td style="padding: 12px 8px; font-size: 13px;">${item.address || '-'}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.itemType || '-'}</td>
        <td style="padding: 12px 8px; text-align: right;">
          <span style="color:#888; font-size:11px;">감정가</span><br>
          <b>${formatAmount(item.appraisalAmount)}</b>
        </td>
        <td style="padding: 12px 8px; text-align: right;">
          <span style="color:#888; font-size:11px;">최저가(${item.minBidRate}%)</span><br>
          <b style="color:#d32f2f;">${formatAmount(item.minBidAmount)}</b>
        </td>
        <td style="padding: 12px 8px; text-align: center;">
          ${item.failCount > 0 ? `<span style="background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:12px; font-size:12px;">${item.failCount}회 유찰</span>` : '신건'}
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size:13px; color:#1565c0;">
          ${item.bidDate || '-'}
        </td>
        <td style="padding: 12px 8px; font-size: 12px;">
          <b style="color:${a.risk_level === '하' ? '#2e7d32' : a.risk_level === '상' ? '#c62828' : '#f57f17'};">${a.risk_level || '-'}</b><br>
          <span style="color:#555;">${(a.risk_summary || '').substring(0, 40)}</span>
        </td>
        <td style="padding: 12px 8px; font-size: 12px; color:#444;">
          인수권리: ${inheritedRights}<br>
          임차인: ${lessee}<br>
          유치권: ${lien}
        </td>
        <td style="padding: 12px 8px; font-size: 12px;">
          <span style="color:#666;">예상취득</span><br>
          <b style="color:#1565c0;">${formatAmount(a.estimated_total_cost)}</b>
        </td>
      </tr>
      <tr style="background:#f8f9ff; border-bottom:2px solid #ddd;">
        <td colspan="10" style="padding: 8px 12px; font-size: 12px; color: #555; font-style: italic;">
          💡 ${a.investment_memo || '-'}
        </td>
      </tr>`;
    }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a237e, #0d47a1); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .stats { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat-box { background: #f3f4f6; border-radius: 8px; padding: 12px 20px; text-align: center; flex: 1; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1a237e; color: white; padding: 10px 8px; text-align: center; font-size: 12px; }
    tr:hover td { background: #fafbff !important; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1 style="margin:0; font-size:22px;">🏛️ 부동산 경매 일일 보고서</h1>
    <p style="margin:8px 0 0 0; opacity:0.85;">${date} | 조건: ${config.majorCategory} ${config.midCategory} ${config.minorCategory} | ${config.court || config.sido}</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div style="font-size:28px; font-weight:bold; color:#1a237e;">${totalCount}</div>
      <div style="color:#666; font-size:13px;">총 신규 물건</div>
    </div>
    <div class="stat-box">
      <div style="font-size:28px; font-weight:bold; color:#2e7d32;">${lowRiskCount}</div>
      <div style="color:#666; font-size:13px;">🟢 저위험</div>
    </div>
    <div class="stat-box">
      <div style="font-size:28px; font-weight:bold; color:#f57f17;">${midRiskCount}</div>
      <div style="color:#666; font-size:13px;">🟡 중위험</div>
    </div>
    <div class="stat-box">
      <div style="font-size:28px; font-weight:bold; color:#c62828;">${highRiskCount}</div>
      <div style="color:#666; font-size:13px;">🔴 고위험</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>사건번호</th>
        <th>소재지</th>
        <th>용도</th>
        <th>감정가</th>
        <th>최저가</th>
        <th>유찰</th>
        <th>매각기일</th>
        <th>위험도</th>
        <th>권리분석</th>
        <th>예상취득비</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <p style="margin-top:20px; font-size:11px; color:#999;">
    본 보고서는 법원경매정보(courtauction.go.kr) 공개 데이터를 기반으로 자동 생성되었습니다.
    실제 입찰 전 반드시 물건명세서, 등기부등본, 현황조사서를 직접 확인하세요.
  </p>
</div>
</body>
</html>`;
}

async function sendReport(items) {
  if (items.length < config.minItemsToNotify) {
    console.log(`📭 신규 물건 ${items.length}건 (최소 ${config.minItemsToNotify}건 미만) — 이메일 발송 생략`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail 앱 비밀번호
    },
  });

  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
  });

  const lowRisk = items.filter(i => i.analysis?.risk_level === '하');
  const subject = `🏛️ [경매 보고서] ${date} | 신규 ${items.length}건 (저위험 ${lowRisk.length}건)`;
  const html = buildHtmlReport(items, date);

  await transporter.sendMail({
    from: `경매 알리미 <${process.env.GMAIL_USER}>`,
    to: config.notifyEmail,
    subject,
    html,
  });

  console.log(`📧 이메일 발송 완료 → ${config.notifyEmail}`);
}

module.exports = { sendReport };
