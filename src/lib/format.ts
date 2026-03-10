/**
 * 숫자를 천 단위 콤마가 있는 문자열로 변환
 * 예: 12345 → "12,345"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}

/**
 * 초를 "M:SS" 형식으로 변환
 * 예: 263 → "4:23"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * CTR 값을 퍼센트 문자열로 변환
 * 예: 6.1 → "6.1%"
 */
export function formatCTR(ctr: number): string {
  return `${ctr.toFixed(1)}%`;
}

/**
 * 잔존율을 퍼센트 문자열로 변환
 * 예: 56.0 → "56%"
 */
export function formatRetention(retention: number | null): string {
  if (retention === null) return "—";
  return `${Math.round(retention)}%`;
}

/**
 * 구독자 변동을 +/- 문자열로 변환
 * 예: gained=10, lost=3 → "+7"
 * 예: gained=1, lost=3 → "-2"
 */
export function formatSubscriberChange(
  gained: number,
  lost: number
): { text: string; isPositive: boolean; isNegative: boolean } {
  const net = gained - lost;
  return {
    text: net >= 0 ? `+${net}` : `${net}`,
    isPositive: net > 0,
    isNegative: net < 0,
  };
}

/**
 * 날짜를 "YYYY. M. D" 형식으로 변환
 * 예: 2026-01-02 → "2026. 1. 2"
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}
