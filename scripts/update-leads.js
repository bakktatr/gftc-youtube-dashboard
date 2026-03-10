const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Campaign data from Chrome scraping (V1+V2, email deduped, date-format only)
const campaigns = {
  '26.02.11_리틀리 V1_기초이론': 157,
  '26.01.13_실력입증': 15,
  '26.01.30_월 500만 원': 10,
  '26.01.26_리메이크': 7,
  '26.01.05_시황': 6,
  '26.01.08_비트코인 시황': 5,
  '26.03.05_볼린저': 5,
  '26.01.24_두바이': 5,
  '26.02.02_리틀리 V2': 5,
  '26.01.27_거래소 정지': 5,
  '26.02.02_리틀리_세미나': 4,
  '26.02.24_골드 시황': 4,
  '26.02.20_골드 시황': 4,
  '26.01.14_매매기법': 4,
  '26.01.30_금 시황': 4,
  '26.01.27_비트코인 시황': 4,
  '26.01.12_매매기법': 3,
  '26.01.06_골드': 3,
  '26.02.19_추세매매': 3,
  '26.02.27_나스닥': 3,
  '26.02.23_OB': 3,
  '26.01.22_인사이트': 3,
  '26.01.30_실력입증': 3,
  '23.02.18_이격도': 3,
  '26.02.03_예은스크립트': 3,
  '26.01.28_부업': 3,
  '26.01.27_나스닥 시황': 3,
  '26.01.19_현강': 3,
  '26.01.23_시황': 3,
  '26.03.03_나스닥': 2,
  '26.02.13_실력 모음집': 2,
  '26.02.20_비트 시황': 2,
  '26.02.20_나스닥 시황': 2,
  '26.02.13_비공개 모음집': 2,
  '26.02.13_나스닥 시황': 2,
  '26.02.13_비트코인 시황': 2,
  '26.02.12_실력입': 2,
  '26.02.06_투자 뉴스': 2,
  '26.02.05_팟캐스트': 2,
  '26.02.03_나스닥 라이브 시황': 2,
  '26.02.03_골드 라이브 시황': 2,
  '26.02.03_비트코인 라이브 시황': 2,
  '26.01.30_비트코인 시황': 2,
  '26.01.27_코스피': 2,
  '26.03.03_비트': 1,
  '26.02.26_심법': 1,
  '26.02.24_나스닥 시황': 1,
  '26.01.30_나스닥 시황': 1,
  '26.02.06_금 시황': 1,
  '26.02.06_비트코인 시황': 1,
  '26.02.06_나스닥 시황': 1,
  '26.01.30_동현크립트': 1,
  '26.01.14_시황': 1
};

const videos = db.prepare('SELECT id, videoId, title, publishedAt FROM Video ORDER BY publishedAt DESC').all();

function toKSTDate(isoStr) {
  const d = new Date(isoStr);
  d.setHours(d.getHours() + 9);
  return d.toISOString().split('T')[0];
}

function campaignToDate(camp) {
  const match = camp.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return '20' + match[1] + '-' + match[2] + '-' + match[3];
}

function keywordMatch(keyword, title) {
  const kw = keyword.toLowerCase();
  const t = title.toLowerCase();
  const patterns = [
    ['비트', '비트코인'], ['나스닥', '나스닥'], ['골드', '금'], ['금 ', '금'],
    ['볼린저', '볼린저'], ['매매기법', '매매'], ['이격도', '이격'],
    ['추세매매', '추세'], ['이동평균', '이동평균'], ['코스피', '코스피'],
    ['부업', '부업'], ['거래소', '거래소'], ['두바이', '두바이'],
    ['캔들', '캔들'], ['거래량', '거래량'], ['리메이크', '매매법'],
    ['시황', '시황'], ['실력', '수익'], ['인사이트', '투자'],
    ['팟캐스트', '팟캐스트'], ['OB', '오더블럭'], ['심법', '심법'],
    ['리틀리', '리틀리'], ['세미나', '세미나'],
  ];
  for (const [kwPat, titlePat] of patterns) {
    if (kw.includes(kwPat.toLowerCase()) && t.includes(titlePat.toLowerCase())) return true;
  }
  return false;
}

// Build date -> videos map
const dateToVideos = {};
videos.forEach(v => {
  const kstDate = toKSTDate(v.publishedAt);
  if (!dateToVideos[kstDate]) dateToVideos[kstDate] = [];
  dateToVideos[kstDate].push(v);
});

// Match
const videoLeadMap = {};
const matched = [];
const unmatched = [];

Object.entries(campaigns).forEach(([camp, count]) => {
  const campDate = campaignToDate(camp);
  if (!campDate) { unmatched.push({camp, count, reason: 'no date'}); return; }

  const keyword = camp.replace(/^\d{2}\.\d{2}\.\d{2}_/, '');
  const vids = dateToVideos[campDate] || [];

  if (vids.length === 0) { unmatched.push({camp, count, reason: 'no video on ' + campDate}); return; }

  if (vids.length === 1) {
    videoLeadMap[vids[0].videoId] = (videoLeadMap[vids[0].videoId] || 0) + count;
    matched.push({camp, count, videoId: vids[0].videoId, type: 'date'});
    return;
  }

  let m = vids.find(v => keywordMatch(keyword, v.title));
  if (m) {
    videoLeadMap[m.videoId] = (videoLeadMap[m.videoId] || 0) + count;
    matched.push({camp, count, videoId: m.videoId, type: 'keyword'});
  } else {
    const per = Math.ceil(count / vids.length);
    vids.forEach(v => { videoLeadMap[v.videoId] = (videoLeadMap[v.videoId] || 0) + per; });
    unmatched.push({camp, count, reason: 'distributed to ' + vids.length + ' videos'});
  }
});

// Reset all leadCounts to 0
db.prepare('UPDATE Video SET leadCount = 0').run();

// Update matched videos
const updateStmt = db.prepare('UPDATE Video SET leadCount = ? WHERE videoId = ?');
let updated = 0;
for (const [videoId, leads] of Object.entries(videoLeadMap)) {
  const result = updateStmt.run(leads, videoId);
  if (result.changes > 0) updated++;
}

const totalMatched = matched.reduce((s, m) => s + m.count, 0);
const totalUnmatched = unmatched.reduce((s, u) => s + u.count, 0);

console.log('=== RESULTS ===');
console.log('Matched leads:', totalMatched);
console.log('Unmatched leads:', totalUnmatched);
console.log('Videos updated:', updated);
console.log('');
console.log('=== UNMATCHED ===');
unmatched.forEach(u => console.log('  ' + u.count + ' | ' + u.camp + ' | ' + u.reason));

// Update erpLastSyncAt
db.prepare("UPDATE Settings SET erpLastSyncAt = datetime('now') WHERE id = 'default'").run();

db.close();
console.log('\nDone!');
