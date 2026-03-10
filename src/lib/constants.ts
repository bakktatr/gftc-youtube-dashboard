// 사용 가능한 카테고리 색상 목록
export const AVAILABLE_COLORS = [
  "orange", "blue", "yellow", "violet", "purple", "fuchsia",
  "emerald", "slate", "cyan", "pink", "indigo", "rose",
  "red", "green", "amber", "teal", "lime", "sky",
] as const;

export type CategoryColor = (typeof AVAILABLE_COLORS)[number];

// 색상 이름 → Tailwind 클래스 매핑 (라이트 테마)
const COLOR_CLASS_MAP: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
  blue: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  yellow: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20",
  violet: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
  purple: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20",
  emerald: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  slate: "bg-slate-500/15 text-slate-300 border border-slate-500/20",
  cyan: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
  pink: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  indigo: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20",
  rose: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
  red: "bg-red-500/15 text-red-300 border border-red-500/20",
  green: "bg-green-500/15 text-green-300 border border-green-500/20",
  amber: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  teal: "bg-teal-500/15 text-teal-300 border border-teal-500/20",
  lime: "bg-lime-500/15 text-lime-300 border border-lime-500/20",
  sky: "bg-sky-500/15 text-sky-300 border border-sky-500/20",
};

// 색상 이름 → 배경 dot 색상
const COLOR_DOT_MAP: Record<string, string> = {
  orange: "bg-orange-400", blue: "bg-blue-400", yellow: "bg-yellow-400",
  violet: "bg-violet-400", purple: "bg-purple-400", fuchsia: "bg-fuchsia-400",
  emerald: "bg-emerald-400", slate: "bg-slate-400", cyan: "bg-cyan-400",
  pink: "bg-pink-400", indigo: "bg-indigo-400", rose: "bg-rose-400",
  red: "bg-red-400", green: "bg-green-400", amber: "bg-amber-400",
  teal: "bg-teal-400", lime: "bg-lime-400", sky: "bg-sky-400",
};

export function getCategoryColorClass(color: string): string {
  return COLOR_CLASS_MAP[color] || COLOR_CLASS_MAP.slate;
}

export function getCategoryDotClass(color: string): string {
  return COLOR_DOT_MAP[color] || COLOR_DOT_MAP.slate;
}

// 테이블 컬럼 정의
export const TABLE_COLUMNS = [
  { key: "title", label: "제목", sortable: true },
  { key: "views", label: "조회수", sortable: true },
  { key: "subscribers", label: "구독자", sortable: true },
  { key: "averageViewDuration", label: "시청시간", sortable: true },
  { key: "ctr", label: "클릭률", sortable: true },
  { key: "retention30s", label: "도입부 30초", sortable: true },
  { key: "publishedAt", label: "날짜", sortable: true },
  { key: "category", label: "카테고리", sortable: true },
] as const;
