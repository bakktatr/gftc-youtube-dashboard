const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Get all videos
const videos = db.prepare('SELECT id, videoId, title, publishedAt FROM Video ORDER BY publishedAt DESC').all();

// Convert publishedAt to KST date (YYYY-MM-DD)
function toKSTDate(isoStr) {
  const d = new Date(isoStr);
  d.setHours(d.getHours() + 9);
  return d.toISOString().split('T')[0];
}

// Convert campaign date (YY.MM.DD) to YYYY-MM-DD
function campaignToDate(camp) {
  const match = camp.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return '20' + match[1] + '-' + match[2] + '-' + match[3];
}

// Campaign data from ERP scraping (V1 + V2 combined, youtube sources only, 2026)
const campaigns = {
  '26.02.11_리틀리 V1_기초이론': 242,
  '26.01.08_비트코인 시황': 5,
  '26.01.13_실력입증': 15,
  '26.01.12_매매기법': 3,
  '26.01.05_시황': 6,
  '26.01.06_골드': 3,
  '26.03.05_볼린저': 10,
  '26.02.19_추세매매': 6,
  '26.03.03_나스닥': 2,
  '26.02.02_리틀리_세미나': 8,
  '26.02.13_실력 모음집': 4,
  '26.02.27_나스닥': 6,
  '26.02.24_골드 시황': 8,
  '26.03.03_비트': 2,
  '26.02.23_OB': 6,
  '26.02.26_심법': 2,
  '26.01.22_인사이트': 4,
  '26.01.30_실력입증': 4,
  '26.02.24_나스닥 시황': 2,
  '26.02.20_골드 시황': 8,
  '23.02.18_이격도': 6,
  '26.02.20_비트 시황': 4,
  '26.02.20_나스닥 시황': 4,
  '26.01.14_매매기법': 18,
  '26.02.13_비공개 모음집': 4,
  '26.02.13_나스닥 시황': 4,
  '26.02.13_비트코인 시황': 4,
  '26.02.12_실력입': 4,
  '26.01.24_두바이': 6,
  '26.02.02_리틀리 V2': 9,
  '26.02.06_투자 뉴스': 4,
  '26.02.06_금 시황': 2,
  '26.01.30_월 500만 원': 11,
  '26.02.06_비트코인 시황': 2,
  '26.02.06_나스닥 시황': 2,
  '26.02.05_팟캐스트': 4,
  '26.02.03_예은스크립트': 3,
  '26.02.03_나스닥 라이브 시황': 2,
  '26.02.03_골드 라이브 시황': 2,
  '26.02.03_비트코인 라이브 시황': 2,
  '26.01.30_동현크립트': 1,
  '26.01.30_나스닥 시황': 1,
  '26.01.30_비트코인 시황': 2,
  '26.01.28_부업': 3,
  '26.01.30_금 시황': 4,
  '26.01.27_비트코인 시황': 4,
  '26.01.26_리메이크': 7,
  '26.01.27_코스피': 2,
  '26.01.27_거래소 정지': 5,
  '26.01.27_나스닥 시황': 3,
  '26.01.26_실력입증': 1,
  '26.01.19_현강': 3,
  '26.01.23_시황': 3,
  '26.01.20_시황': 3,
  '26.01.14_시황': 4
};

// Build date -> videos map
const dateToVideos = {};
videos.forEach(v => {
  const kstDate = toKSTDate(v.publishedAt);
  if (!dateToVideos[kstDate]) dateToVideos[kstDate] = [];
  dateToVideos[kstDate].push(v);
});

// Keyword matching helper
function keywordMatch(keyword, title) {
  const kw = keyword.toLowerCase();
  const t = title.toLowerCase();

  // Direct keyword patterns
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

// Match campaigns to videos
const results = [];
const unmatched = [];

// Aggregate: same video can have multiple campaigns (e.g., same date different keywords)
const videoLeadMap = {};

Object.entries(campaigns).forEach(([camp, count]) => {
  const campDate = campaignToDate(camp);
  if (!campDate) {
    unmatched.push({ campaign: camp, count, reason: 'no date' });
    return;
  }

  const keyword = camp.replace(/^\d{2}\.\d{2}\.\d{2}_/, '');
  const videosOnDate = dateToVideos[campDate] || [];

  if (videosOnDate.length === 0) {
    unmatched.push({ campaign: camp, count, reason: 'no video on ' + campDate });
    return;
  }

  if (videosOnDate.length === 1) {
    const vid = videosOnDate[0];
    videoLeadMap[vid.videoId] = (videoLeadMap[vid.videoId] || 0) + count;
    results.push({ videoId: vid.videoId, title: vid.title.substring(0, 35), campaign: camp, leads: count, matchType: 'date-only' });
    return;
  }

  // Multiple videos on same date - try keyword match
  let matched = videosOnDate.find(v => keywordMatch(keyword, v.title));

  if (matched) {
    videoLeadMap[matched.videoId] = (videoLeadMap[matched.videoId] || 0) + count;
    results.push({ videoId: matched.videoId, title: matched.title.substring(0, 35), campaign: camp, leads: count, matchType: 'keyword' });
  } else {
    // Distribute evenly among videos on same date as fallback
    const perVideo = Math.ceil(count / videosOnDate.length);
    videosOnDate.forEach(v => {
      videoLeadMap[v.videoId] = (videoLeadMap[v.videoId] || 0) + perVideo;
    });
    unmatched.push({ campaign: camp, count, reason: 'no keyword match on ' + campDate + ' (' + videosOnDate.length + ' videos)', distributed: true });
  }
});

console.log('=== MATCHED CAMPAIGNS ===');
results.sort((a, b) => b.leads - a.leads);
results.forEach(r => console.log(`  ${r.leads.toString().padStart(3)} leads | ${r.campaign.padEnd(35)} → ${r.title}`));

console.log('\n=== UNMATCHED CAMPAIGNS ===');
unmatched.forEach(u => console.log(`  ${u.count.toString().padStart(3)} leads | ${u.campaign.padEnd(35)} - ${u.reason}`));

console.log('\n=== VIDEO LEAD SUMMARY ===');
const summary = Object.entries(videoLeadMap).sort((a, b) => b[1] - a[1]);
summary.forEach(([vid, leads]) => {
  const v = videos.find(x => x.videoId === vid);
  console.log(`  ${leads.toString().padStart(3)} leads | ${vid} | ${v ? v.title.substring(0, 40) : 'unknown'}`);
});

console.log('\nTotal matched leads:', results.reduce((s, r) => s + r.leads, 0));
console.log('Total unmatched leads:', unmatched.reduce((s, u) => s + u.count, 0));
console.log('Videos with leads:', summary.length, '/', videos.length);

// Output the videoLeadMap as JSON for DB update
console.log('\n=== JSON OUTPUT ===');
console.log(JSON.stringify(videoLeadMap));

db.close();
