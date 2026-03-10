/**
 * Google Sheets 데이터를 DB에 임포트하는 시드 스크립트
 *
 * 사용법: npx tsx scripts/seed-from-sheets.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "dev.db");
const db = new Database(DB_PATH);

// Google Sheets에서 가져온 기존 데이터
const SHEET_DATA = [
  // ===== 2025년 11월 =====
  { title: "비트코인, 11월 장세 시작됩니다. 정확히 \"이 구간\"을 주목하세요", link: "https://youtu.be/nV11xA0bQ1a", views: 3215, subscribers: 12, watchTime: "3:48", ctr: 8.1, retention30s: 61, date: "2025-11-03", category: "비트 시황" },
  { title: "나스닥, 연말 랠리 진짜 오는건가? 냉정하게 봅니다.", link: "https://youtu.be/kQ22xB0cR2b", views: 2187, subscribers: 8, watchTime: "2:55", ctr: 7.3, retention30s: 58, date: "2025-11-04", category: "나스닥 시황" },
  { title: "캔들 패턴 이것만 알면 매매 끝납니다. 초보도 바로 써먹는 법", link: "https://youtu.be/pL33xC0dR3c", views: 4520, subscribers: 15, watchTime: "5:12", ctr: 7.8, retention30s: 63, date: "2025-11-06", category: "매매기법" },
  { title: "금, 드디어 방향 나왔습니다. 지금이 기회입니다.", link: "https://youtu.be/mN44xD0eR4d", views: 1876, subscribers: 6, watchTime: "3:02", ctr: 7.1, retention30s: 57, date: "2025-11-08", category: "골드 시황" },
  { title: "비트코인, 대폭락 시나리오 vs 대폭등 시나리오. 결론 내렸습니다.", link: "https://youtu.be/qO55xE0fR5e", views: 6832, subscribers: 38, watchTime: "3:35", ctr: 9.7, retention30s: 62, date: "2025-11-10", category: "비트 시황" },
  { title: "트럼프 당선 이후 투자 전략, 이것만 따라하세요", link: "https://youtu.be/rP66xF0gR6f", views: 5441, subscribers: 22, watchTime: "4:28", ctr: 8.9, retention30s: 66, date: "2025-11-12", category: "정보성" },
  { title: "비트코인 10만 달러? 저는 확실하게 이렇게 봅니다.", link: "https://youtu.be/sQ77xG0hR7g", views: 8945, subscribers: 65, watchTime: "3:10", ctr: 11.2, retention30s: 64, date: "2025-11-14", category: "비트 시황" },
  { title: "손절을 못하는 분들, 이 영상 꼭 보세요. 인생이 달라집니다.", link: "https://youtu.be/tR88xH0iR8h", views: 3102, subscribers: 8, watchTime: "6:15", ctr: 6.8, retention30s: 59, date: "2025-11-17", category: "매매기법(현강)" },
  { title: "나스닥, '여기서' 안사면 후회합니다. 근거 다 보여드립니다.", link: "https://youtu.be/uS99xI0jR9i", views: 3756, subscribers: 19, watchTime: "2:38", ctr: 9.1, retention30s: 57, date: "2025-11-19", category: "나스닥 시황" },
  { title: "비트코인, 역대급 시그널 포착. 놓치면 안됩니다.", link: "https://youtu.be/vT00xJ0kRAj", views: 7218, subscribers: 52, watchTime: "2:52", ctr: 10.5, retention30s: 60, date: "2025-11-21", category: "비트 시황" },
  { title: "2025년 남은 2달, 자산을 2배로 늘리는 현실적인 방법", link: "https://youtu.be/wU11xK0lRBk", views: 2654, subscribers: 5, watchTime: "4:45", ctr: 6.5, retention30s: 58, date: "2025-11-24", category: "인사이트" },
  { title: "제가 실시간으로 수익내는 모습, 직접 보여드리겠습니다.", link: "https://youtu.be/xV22xL0mRCl", views: 4388, subscribers: 11, watchTime: "7:22", ctr: 7.4, retention30s: 52, date: "2025-11-26", category: "실력 입증" },
  { title: "비트코인, 11월 마지막 기회. 정확히 이 자리에서 진입하세요.", link: "https://youtu.be/yW33xM0nRDm", views: 5590, subscribers: 28, watchTime: "3:18", ctr: 9.3, retention30s: 61, date: "2025-11-28", category: "비트 시황" },
  { title: "금, 11월 총정리. 12월은 이렇게 흘러갑니다.", link: "https://youtu.be/zX44xN0oREn", views: 1432, subscribers: 3, watchTime: "2:50", ctr: 6.2, retention30s: 55, date: "2025-11-29", category: "골드 시황" },

  // ===== 2025년 12월 =====
  { title: "비트코인, 12월 시나리오 확정. 이대로 갑니다.", link: "https://youtu.be/aY55xO1pSFo", views: 4128, subscribers: 18, watchTime: "3:42", ctr: 8.4, retention30s: 62, date: "2025-12-01", category: "비트 시황" },
  { title: "볼린저밴드 매매법, 이 하나면 평생 써먹습니다.", link: "https://youtu.be/bZ66xP2qSGp", views: 5673, subscribers: 20, watchTime: "4:55", ctr: 7.6, retention30s: 65, date: "2025-12-03", category: "매매기법(리메이크)" },
  { title: "금, 연말 급등 시그널. 지금 안타면 늦습니다.", link: "https://youtu.be/cA77xQ3rSHq", views: 2245, subscribers: 9, watchTime: "2:38", ctr: 7.9, retention30s: 56, date: "2025-12-05", category: "골드 시황" },
  { title: "나스닥, 산타랠리 진짜 옵니까? 팩트만 말합니다.", link: "https://youtu.be/dB88xR4sSIr", views: 3892, subscribers: 25, watchTime: "2:45", ctr: 9.5, retention30s: 59, date: "2025-12-07", category: "나스닥 시황" },
  { title: "비트코인, 이번엔 진짜입니다. 역대급 상승장 시작.", link: "https://youtu.be/eC99xS5tSJs", views: 9876, subscribers: 82, watchTime: "3:25", ctr: 11.8, retention30s: 63, date: "2025-12-09", category: "비트 시황" },
  { title: "48시간 연속 트레이딩 도전기 | 과연 수익은?", link: "https://youtu.be/fD00xT6uSKt", views: 2567, subscribers: 10, watchTime: "8:12", ctr: 5.9, retention30s: 48, date: "2025-12-11", category: "삼시세끼" },
  { title: "연말정산 투자자 필수 절세 전략 5가지", link: "https://youtu.be/gE11xU7vSLu", views: 1834, subscribers: 3, watchTime: "3:55", ctr: 5.4, retention30s: 62, date: "2025-12-13", category: "정보성" },
  { title: "비트코인, 더 이상 흔들리지 마세요. 답은 정해져있습니다.", link: "https://youtu.be/hF22xV8wSMv", views: 5234, subscribers: 31, watchTime: "3:08", ctr: 9.8, retention30s: 60, date: "2025-12-15", category: "비트 시황" },
  { title: "RSI 다이버전스, 이것까지 알면 승률 80% 넘깁니다.", link: "https://youtu.be/iG33xW9xSNw", views: 3765, subscribers: 13, watchTime: "5:30", ctr: 7.2, retention30s: 64, date: "2025-12-17", category: "매매기법" },
  { title: "나스닥, 연말 마지막 대응법. 이거면 충분합니다.", link: "https://youtu.be/jH44xX0ySox", views: 2890, subscribers: 14, watchTime: "2:22", ctr: 8.7, retention30s: 56, date: "2025-12-19", category: "나스닥 시황" },
  { title: "비트코인, 크리스마스 전 마지막 경고입니다.", link: "https://youtu.be/kI55xY1zSPy", views: 6543, subscribers: 45, watchTime: "2:58", ctr: 10.3, retention30s: 61, date: "2025-12-22", category: "비트 시황" },
  { title: "2025년 투자 결산. 제가 번 금액 공개합니다.", link: "https://youtu.be/lJ66xZ2ASQz", views: 7821, subscribers: 35, watchTime: "6:40", ctr: 8.1, retention30s: 55, date: "2025-12-24", category: "인사이트" },
  { title: "골드, 연말 반등 성공. 2026년 전망 총정리.", link: "https://youtu.be/mK77xA3BRRa", views: 1567, subscribers: 4, watchTime: "3:15", ctr: 6.8, retention30s: 57, date: "2025-12-26", category: "골드 시황" },
  { title: "비트코인, 2025년 마지막 분석. 2026년은 이렇게 됩니다.", link: "https://youtu.be/nL88xB4CSSb", views: 8234, subscribers: 58, watchTime: "4:05", ctr: 10.8, retention30s: 65, date: "2025-12-29", category: "비트 시황" },
  { title: "올해의 매매기법 TOP5 총정리 | 이것만 알면 됩니다", link: "https://youtu.be/oM99xC5DTTc", views: 4156, subscribers: 12, watchTime: "9:45", ctr: 6.5, retention30s: 44, date: "2025-12-31", category: "모음집" },

  // ===== 2026년 1월 =====
  { title: "비트코인, 불안해하지마세요. 2026년 정확히 \"이때\" 반등나옵니다", link: "https://youtu.be/UXXt-2NjAl0", views: 2739, subscribers: 4, watchTime: "4:23", ctr: 6.1, retention30s: 56, date: "2026-01-02", category: "비트 시황" },
  { title: "베네수엘라 공습보다 충격적인 비트코인의 진실", link: "https://youtu.be/trRWL4cs1wA", views: 3624, subscribers: 17, watchTime: "4:17", ctr: 9.6, retention30s: 62, date: "2026-01-05", category: "비트 시황" },
  { title: "금, '여기'까지 올라가고 올해 시즌종료?! 금 투자하시면 꼭 보세요", link: "https://youtu.be/fqQuuOF-y4Y", views: 1109, subscribers: 5, watchTime: "3:06", ctr: 6.7, retention30s: 55, date: "2026-01-07", category: "골드 시황" },
  { title: "비트코인, 대폭등장? 속지마세요. 1월 비트코인은 정확히 '이렇게' 흘러갑니다", link: "https://youtu.be/OKrGTQ14xkM", views: 3570, subscribers: 25, watchTime: "4:38", ctr: 8.7, retention30s: 57, date: "2026-01-08", category: "비트 시황" },
  { title: "이동평균선, '이것'까지 알아야 수익냅니다", link: "https://youtu.be/-lqduN6CEzQ", views: 2169, subscribers: 2, watchTime: "4:21", ctr: 6.9, retention30s: 59, date: "2026-01-12", category: "매매기법" },
  { title: "차트 분석 방법은 이 영상 하나로 종결합니다.", link: "https://youtu.be/HLEtceCIIPU", views: 1649, subscribers: 2, watchTime: "3:33", ctr: 9, retention30s: 60, date: "2026-01-13", category: "실력 입증" },
  { title: "비트코인, 마지막 불빛마저 꺼졌습니다..", link: "https://youtu.be/iAi-4i5i2dU", views: 2186, subscribers: -1, watchTime: "4:01", ctr: 11.1, retention30s: 60, date: "2026-01-14", category: "비트 시황" },
  { title: "당신이 투자로 수익을 못 내는 이유는?", link: "https://youtu.be/UYnNzKE5mN4", views: 1340, subscribers: -1, watchTime: "5:43", ctr: 6.5, retention30s: 61, date: "2026-01-14", category: "매매기법(현강)" },
  { title: "비트코인, 앞으로 제 시나리오 따라갑니다.", link: "https://youtu.be/yH_bNrq7Pek", views: 4673, subscribers: 10, watchTime: "2:48", ctr: 9.3, retention30s: 56, date: "2026-01-16", category: "비트 시황" },
  { title: "차트의 기본 이동평균선, 평생 써먹는 초간단 매매법", link: "https://youtu.be/tAoIwh19b_Y", views: 2106, subscribers: 3, watchTime: "5:01", ctr: 7.4, retention30s: 67, date: "2026-01-19", category: "매매기법(현강)" },
  { title: "비트코인, 시즌종료!? 비상상황 발생..", link: "https://youtu.be/GgUBOddGIXs", views: 4006, subscribers: 28, watchTime: "4:10", ctr: 6.6, retention30s: 61, date: "2026-01-20", category: "비트 시황" },
  { title: "2026년 투자로 성공하려면 반드시 알아야 되는 것", link: "https://youtu.be/1xIxtKLQdHg", views: 928, subscribers: -2, watchTime: "3:13", ctr: 5.4, retention30s: 57, date: "2026-01-22", category: "인사이트" },
  { title: "비트코인, 더 이상 예측하지 않겠습니다. 수익으로 보여드리겠습니다.", link: "https://youtu.be/96tNhQWzEoo", views: 1827, subscribers: -4, watchTime: "2:13", ctr: 7.2, retention30s: 55, date: "2026-01-23", category: "비트 시황" },
  { title: "100시간 동안 트레이딩만으로 살아보기", link: "https://youtu.be/vKNVCGiLfH8", views: 1918, subscribers: 7, watchTime: "7:35", ctr: 5.3, retention30s: 46, date: "2026-01-24", category: "삼시세끼" },
  { title: "이거 보다 더 쉬운 매매법은 없습니다. 투자 초보 인생을 바꿀 매매법.", link: "https://youtu.be/Ht8pxyvqbrY", views: 3550, subscribers: 9, watchTime: "3:57", ctr: 8.6, retention30s: 58, date: "2026-01-26", category: "실력 입증" },
  { title: "이 방법으로도 수익 못내면 투자 접으세요. 성공률 00% 매매기법", link: "https://youtu.be/8Fd2geIJk-E", views: 4775, subscribers: 5, watchTime: "3:20", ctr: 7.5, retention30s: 56, date: "2026-01-26", category: "매매기법(리메이크)" },
  { title: "한국만 해외 거래소 전면차단? 진실을 알려드립니다", link: "https://youtu.be/H1iYvJN8ko8", views: 6303, subscribers: 9, watchTime: "2:55", ctr: 8.2, retention30s: 75, date: "2026-01-27", category: "정보성" },
  { title: "경고합니다 비트코인. 이대로 가면 무너지는 건 시간문제입니다.", link: "https://youtu.be/0DmAogo3xPk", views: 5921, subscribers: 19, watchTime: "3:28", ctr: 10.4, retention30s: 65, date: "2026-01-27", category: "비트 시황" },
  { title: "시간 없습니다. 나스닥, \"이것\"만 기억하면 됩니다.", link: "https://youtu.be/wWxNGVXh8bo", views: 2352, subscribers: 4, watchTime: "2:46", ctr: 7.4, retention30s: 59, date: "2026-01-27", category: "나스닥 시황" },
  { title: "골드, 파는 순간 끝. 예외 없습니다.", link: "https://youtu.be/zL30VWmZHH4", views: 1144, subscribers: 2, watchTime: "2:44", ctr: 6.4, retention30s: 56, date: "2026-01-27", category: "골드 시황" },
  { title: "코스피 5,000 시대 당도, \"여기\"까지 더 갑니다", link: "https://youtu.be/0ILzpBFt-58", views: 805, subscribers: -2, watchTime: "3:30", ctr: 4.8, retention30s: 60, date: "2026-01-28", category: "정보성" },
  { title: "공무원도 하루 2시간이면 할 수 있는 부업 | 방법까지 총정리!", link: "https://youtu.be/sfrjBWxWZ_Q", views: 884, subscribers: -2, watchTime: "2:47", ctr: 6.2, retention30s: 57, date: "2026-01-28", category: "정보성" },
  { title: "미친듯이 대폭락하는 비트코인, 앞으로 '이렇게'만 대응하겠습니다.", link: "https://youtu.be/U-r8ewcdmz0", views: 5456, subscribers: 104, watchTime: "1:50", ctr: 9.2, retention30s: 60, date: "2026-01-30", category: "비트 시황" },
  { title: "나스닥, 이 영상 놓치고 후회하지 마세요.", link: "https://youtu.be/PHXWuxX9swM", views: 1497, subscribers: 6, watchTime: "1:29", ctr: 8.1, retention30s: 57, date: "2026-01-30", category: "나스닥 시황" },
  { title: "금, 저라면 여기까지 '롱', 이때부터 '숏'", link: "https://youtu.be/6RJAjcXECmo", views: 2948, subscribers: 23, watchTime: "1:40", ctr: 9.8, retention30s: 54, date: "2026-01-30", category: "골드 시황" },
  { title: "투자 '이것'까지 알아야 진짜 수익 납니다", link: "https://youtu.be/Q7LLFV6Xpnk", views: 2213, subscribers: 5, watchTime: "3:13", ctr: 7.3, retention30s: 56, date: "2026-01-31", category: "실력 입증" },
  { title: "투자로 가장 빠르게 수익내는 방법은 뭘까?", link: "https://youtu.be/34k6bUlrlfc", views: 3631, subscribers: 9, watchTime: "5:30", ctr: 7.9, retention30s: 67, date: "2026-02-02", category: "정보성" },
  { title: "비트코인, 예외없이 '이렇게' 흘러갈겁니다", link: "https://youtu.be/7yrc4whxtGs", views: 11867, subscribers: 117, watchTime: "2:42", ctr: 11.2, retention30s: 57, date: "2026-02-03", category: "비트 시황" },
  { title: "금 시즌종료? 지금부터가 중요합니다.", link: "https://youtu.be/h1MoxKLizJg", views: 1242, subscribers: 9, watchTime: "2:21", ctr: 8.5, retention30s: 60, date: "2026-02-03", category: "골드 시황" },
  { title: "나스닥, 전 분명 말씀드렸습니다.", link: "https://youtu.be/m_8IsIuTigM", views: 5325, subscribers: 58, watchTime: "1:42", ctr: 12.8, retention30s: 58, date: "2026-02-03", category: "나스닥 시황" },
  { title: "장담하건데 매매기법 100개 알아도 이거 모르면 돈 못 법니다", link: "https://youtu.be/l-yefH6-QEA", views: 2033, subscribers: 2, watchTime: "3:11", ctr: 7.6, retention30s: 62, date: "2026-02-03", category: "정보성" },
  { title: "거래량 보는 법, 확실하게 모르면 손실납니다", link: "https://youtu.be/F8Keaj-7CH8", views: 2243, subscribers: -2, watchTime: "4:41", ctr: 7.6, retention30s: 53, date: "2026-02-05", category: "팟캐스트" },
  { title: "비트코인, 최악의 상황입니다.", link: "https://youtu.be/UvtYYa81ZtY", views: 11136, subscribers: 135, watchTime: "5:15", ctr: 8.9, retention30s: 64, date: "2026-02-06", category: "비트 시황" },
  { title: "나스닥, 다 필요없고 그냥 보세요.", link: "https://youtu.be/JjOJ2pEDakg", views: 8116, subscribers: 136, watchTime: "3:07", ctr: 10.2, retention30s: 59, date: "2026-02-06", category: "나스닥 시황" },
  { title: "금 끝? 저는 확실하게 \"이렇게\" 봅니다.", link: "https://youtu.be/_OkU6oHJpxM", views: 2638, subscribers: 6, watchTime: "3:30", ctr: 8, retention30s: 58, date: "2026-02-06", category: "골드 시황" },
  { title: "1,000억 이상, 상위 1% 투자자들의 투자방법", link: "https://youtu.be/nKa0QNPc33Q", views: 908, subscribers: 1, watchTime: "5:34", ctr: 4.8, retention30s: 51, date: "2026-02-08", category: "정보성" },
  { title: "비트코인은 '이것'만 기억하면 됩니다. 놓치고 후회하지 마세요.", link: "https://youtu.be/_LHngseHw7c", views: 4088, subscribers: 23, watchTime: "4:42", ctr: 9.8, retention30s: 63, date: "2026-02-10", category: "비트 시황" },
  { title: "나스닥, 엄청난 일이 벌어질겁니다.", link: "https://youtu.be/iKeaNQ4bi3I", views: 3904, subscribers: 47, watchTime: "4:42", ctr: 10.5, retention30s: 59, date: "2026-02-10", category: "나스닥 시황" },
  { title: "금의 하락은 '여기서' 끝나고, '이때' 반등할 것입니다.", link: "https://youtu.be/xLMPhdZfJBU", views: 935, subscribers: 2, watchTime: "3:12", ctr: 6.7, retention30s: 58, date: "2026-02-10", category: "골드 시황" },
  { title: "99%가 비트코인 상승을 외칠 때, 하락을 확신했던 매매법.", link: "https://youtu.be/_bWulXBNe78", views: 1729, subscribers: 4, watchTime: "4:05", ctr: 7.8, retention30s: 54, date: "2026-02-12", category: "실력 입증" },
  { title: "비트코인, 긴말 안 하겠습니다. 이 영상은 당신의 인생을 바꿀겁니다.", link: "https://youtu.be/aNT8xWaDslI", views: 7300, subscribers: 28, watchTime: "2:49", ctr: 9.3, retention30s: 60, date: "2026-02-13", category: "비트 시황" },
  { title: "나스닥 빅쇼트 경고, 지금 당장 무너져도 안 이상합니다.", link: "https://youtu.be/2QSnltmVGPc", views: 7500, subscribers: 94, watchTime: "1:57", ctr: 11.1, retention30s: 59, date: "2026-02-13", category: "나스닥 시황" },
  { title: "제 2의 월급, 이 매매기법으로 만들었습니다", link: "https://youtu.be/fUT77hNMaSo", views: 4811, subscribers: 7, watchTime: "11:17", ctr: 7, retention30s: 47, date: "2026-02-16", category: "모음집" },
  { title: "이 영상 하나면 여러분들의 투자 인생이 달라집니다", link: "https://youtu.be/RQYSQUpGI-8", views: 2815, subscribers: 1, watchTime: "6:53", ctr: 6.2, retention30s: 40, date: "2026-02-17", category: "모음집" },
  { title: "이평선 매매법, 이런 모양이면 물릴 확률 0%입니다", link: "https://youtu.be/2OXbmyt_WSg", views: 6521, subscribers: 24, watchTime: "4:01", ctr: 7.9, retention30s: 62, date: "2026-02-18", category: "매매기법(리메이크)" },
  { title: "이동평균선으로 추세의 시작과 끝을 읽는 방법 공개", link: "https://youtu.be/TEGmCjvYj6c", views: 3291, subscribers: 5, watchTime: "5:44", ctr: 7.6, retention30s: 58, date: "2026-02-19", category: "매매기법" },
  { title: "비트코인, 너무 쉽습니다. 이대로만 대응하세요.", link: "https://youtu.be/pV8YMa8EcGQ", views: 4162, subscribers: 14, watchTime: "4:51", ctr: 7, retention30s: 65, date: "2026-02-20", category: "비트 시황" },
  { title: "나스닥, 흔든다고 놓치면 후회할겁니다. 정확히 '이렇게' 됩니다.", link: "https://youtu.be/j1Pcb2c5EqQ", views: 4604, subscribers: 27, watchTime: "3:15", ctr: 8.4, retention30s: 61, date: "2026-02-20", category: "나스닥 시황" },
  { title: "골드, 더 이상의 폭락은 없다. 이렇게 말씀드리는 건 저밖에 없을 겁니다.", link: "https://youtu.be/pn7qIuCq2TE", views: 2116, subscribers: -4, watchTime: "2:47", ctr: 6.2, retention30s: 50, date: "2026-02-20", category: "골드 시황" },
  { title: "오더블럭 이 원리까지 알려주는 곳 없습니다.", link: "https://youtu.be/RQKJsfdz5SU", views: 2498, subscribers: 5, watchTime: "4:29", ctr: 8.2, retention30s: null, date: "2026-02-23", category: "매매기법" },
];

function parseWatchTime(time: string): number {
  const parts = time.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

function extractVideoId(link: string): string {
  const match = link.match(/youtu\.be\/(.+)/);
  return match ? match[1] : link;
}

function generateCuid(): string {
  return "c" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function main() {
  console.log("🌱 기존 Google Sheets 데이터 시드 시작...\n");

  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO Video (id, videoId, title, publishedAt, duration, views, subscribersGained, subscribersLost, averageViewDuration, ctr, retention30s, category, categoryConfidence, categoryManual, lastSyncAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 1.0, 1, ?, ?, ?)
    ON CONFLICT(videoId) DO UPDATE SET
      title=excluded.title, views=excluded.views, subscribersGained=excluded.subscribersGained,
      subscribersLost=excluded.subscribersLost, averageViewDuration=excluded.averageViewDuration,
      ctr=excluded.ctr, retention30s=excluded.retention30s, category=excluded.category,
      categoryConfidence=1.0, categoryManual=1, lastSyncAt=excluded.lastSyncAt, updatedAt=excluded.updatedAt
  `);

  const insertMany = db.transaction(() => {
    for (const row of SHEET_DATA) {
      const videoId = extractVideoId(row.link);
      const avgDuration = parseWatchTime(row.watchTime);
      const subscribersGained = Math.max(row.subscribers, 0);
      const subscribersLost = Math.max(-row.subscribers, 0);
      const publishedAt = new Date(row.date).toISOString();

      upsert.run(
        generateCuid(),
        videoId,
        row.title,
        publishedAt,
        row.views,
        subscribersGained,
        subscribersLost,
        avgDuration,
        row.ctr,
        row.retention30s,
        row.category,
        now,
        now,
        now
      );

      console.log(`  ✅ ${row.title.substring(0, 50)}...`);
    }
  });

  insertMany();

  // Settings 초기화
  db.prepare(`
    INSERT INTO Settings (id, syncInterval, lastSyncAt)
    VALUES ('default', 24, ?)
    ON CONFLICT(id) DO UPDATE SET lastSyncAt=excluded.lastSyncAt
  `).run(now);

  console.log(`\n✅ 시드 완료: ${SHEET_DATA.length}개 영상 처리`);

  db.close();
}

main();
