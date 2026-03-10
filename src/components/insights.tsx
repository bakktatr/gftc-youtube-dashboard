"use client";

import { useMemo, useState } from "react";
import { formatNumber, formatDuration, formatCTR } from "@/lib/format";

interface VideoData {
  title: string;
  publishedAt: Date;
  views: number;
  subscriberChange: number;
  averageViewDuration: number;
  ctr: number;
  retention30s: number | null;
  category: string | null;
  duration: number;
}

interface InsightsProps {
  videos: VideoData[];
}

function truncTitle(title: string, max: number) {
  return title.length > max ? title.slice(0, max) + "…" : title;
}

function generateInsights(videos: VideoData[]): string[] {
  if (videos.length < 3) return [];

  const results: string[] = [];

  // Basic stats
  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = Math.round(totalViews / videos.length);
  const avgCTR = videos.reduce((s, v) => s + v.ctr, 0) / videos.length;
  const avgDuration = Math.round(
    videos.reduce((s, v) => s + v.averageViewDuration, 0) / videos.length
  );
  const totalSubs = videos.reduce((s, v) => s + v.subscriberChange, 0);

  // Retention stats
  const withRetention = videos.filter((v) => v.retention30s !== null);
  const avgRetention =
    withRetention.length > 0
      ? withRetention.reduce((s, v) => s + v.retention30s!, 0) /
        withRetention.length
      : null;

  // Top performers
  const byViews = [...videos].sort((a, b) => b.views - a.views);
  const top1 = byViews[0];
  const top3 = byViews.slice(0, 3);
  const top3Views = top3.reduce((s, v) => s + v.views, 0);
  const top3Pct = Math.round((top3Views / totalViews) * 100);

  // 1. 채널 전체 퍼포먼스
  results.push(
    `${videos.length}개 영상 평균 ${formatNumber(avgViews)}회, 총 ${formatNumber(totalViews)}회. 상위 3개가 ${top3Pct}% 차지 — 조회수 편중 ${top3Pct > 30 ? "뚜렷" : "양호"}.`
  );

  // 2. 최고 성과 영상
  const retText = top1.retention30s !== null ? ` / 잔존 ${Math.round(top1.retention30s)}%` : "";
  results.push(
    `TOP 1 "${truncTitle(top1.title, 22)}" ${formatNumber(top1.views)}회, CTR ${formatCTR(top1.ctr)}${retText}. ${top1.ctr > avgCTR ? "높은 클릭률이 조회수 견인" : "노출 볼륨으로 조회수 확보"}.`
  );

  // 3. CTR 분석
  const highCTR = videos.filter((v) => v.ctr > avgCTR * 1.2);
  const lowCTR = videos.filter((v) => v.ctr < avgCTR * 0.8);
  const highCTRAvgViews = Math.round(highCTR.reduce((s, v) => s + v.views, 0) / (highCTR.length || 1));
  results.push(
    `평균 CTR ${formatCTR(avgCTR)}. 상위(+20%) ${highCTR.length}개 vs 하위(-20%) ${lowCTR.length}개. CTR 상위 평균 ${formatNumber(highCTRAvgViews)}회로 ${highCTRAvgViews > avgViews ? "노출 효율 우수" : "노출 확보 필요"}.`
  );

  // 4. 30초 잔존율
  if (avgRetention !== null && withRetention.length >= 5) {
    const highRet = withRetention.filter((v) => v.retention30s! >= 60);
    const lowRet = withRetention.filter((v) => v.retention30s! < 50);
    results.push(
      `30초 잔존율 평균 ${Math.round(avgRetention)}%. 60%↑ ${highRet.length}개, 50%↓ ${lowRet.length}개 — ${highRet.length > lowRet.length ? "초반 후킹 안정적" : "오프닝 임팩트 강화 필요"}.`
    );
  } else {
    results.push(
      `30초 잔존율 데이터 ${withRetention.length}개 확보. 축적 시 인트로 패턴별 이탈률 비교 분석 가능.`
    );
  }

  // 5. 구독 전환 효율
  const subsPerView = totalViews > 0 ? (totalSubs / totalViews) * 100 : 0;
  const bestSubVideo = [...videos].sort(
    (a, b) =>
      (b.subscriberChange / (b.views || 1)) -
      (a.subscriberChange / (a.views || 1))
  )[0];
  results.push(
    `구독 전환율 ${subsPerView.toFixed(2)}%. 최고 효율 "${truncTitle(bestSubVideo.title, 18)}" ${formatNumber(bestSubVideo.views)}회/+${bestSubVideo.subscriberChange}명 — ${bestSubVideo.subscriberChange / (bestSubVideo.views || 1) > subsPerView / 100 * 2 ? "CTA 패턴 벤치마크 권장" : "균일한 전환 패턴"}.`
  );

  // 6. 영상 길이별 퍼포먼스
  const shortVideos = videos.filter((v) => v.duration < 300);
  const midVideos = videos.filter((v) => v.duration >= 300 && v.duration < 600);
  const longVideos = videos.filter((v) => v.duration >= 600);
  const segments = [
    { label: "5분↓", vids: shortVideos },
    { label: "5~10분", vids: midVideos },
    { label: "10분↑", vids: longVideos },
  ].filter((s) => s.vids.length > 0);
  const bestSegment = segments.reduce((a, b) =>
    (a.vids.reduce((s, v) => s + v.views, 0) / a.vids.length) >
    (b.vids.reduce((s, v) => s + v.views, 0) / b.vids.length) ? a : b
  );
  results.push(
    `길이별: ${segments.map((s) => `${s.label} ${s.vids.length}개(${formatNumber(Math.round(s.vids.reduce((sum, v) => sum + v.views, 0) / s.vids.length))}회)`).join(" / ")}. ${bestSegment.label} 구간 효율 최고 — 기본 포맷 권장.`
  );

  // 7. 시청 지속시간 효율
  const avgWatchRatio =
    videos.reduce((s, v) => s + (v.duration > 0 ? v.averageViewDuration / v.duration : 0), 0) /
    videos.length;
  results.push(
    `평균 시청 ${formatDuration(avgDuration)}, 시청 비율 ${Math.round(avgWatchRatio * 100)}%. ${avgWatchRatio >= 0.4 ? "유튜브 평균(30~40%) 이상으로 알고리즘 추천에 긍정적" : "중반부 이탈 방지를 위한 편집 리듬 개선 필요"}.`
  );

  // 8. 히든 젬
  const hiddenGems = videos
    .filter((v) => v.ctr > avgCTR && v.views < avgViews * 0.5)
    .sort((a, b) => b.ctr - a.ctr);
  if (hiddenGems.length > 0) {
    const gem = hiddenGems[0];
    results.push(
      `히든 젬: "${truncTitle(gem.title, 22)}" CTR ${formatCTR(gem.ctr)}이나 ${formatNumber(gem.views)}회. 노출 부족 — 커뮤니티·숏폼 재활성화 권장.`
    );
  } else {
    const under = byViews[byViews.length - 1];
    results.push(
      `하위 영상 "${truncTitle(under.title, 22)}"(${formatNumber(under.views)}회) CTR ${formatCTR(under.ctr)} — ${under.ctr < avgCTR ? "썸네일 리뉴얼 또는 숏폼 전환 고려" : "키워드 SEO 보강 필요"}.`
    );
  }

  // 9. 업로드 빈도·트렌드
  const sortedByDate = [...videos].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const firstDate = new Date(sortedByDate[0].publishedAt);
  const lastDate = new Date(sortedByDate[sortedByDate.length - 1].publishedAt);
  const daySpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const uploadsPerWeek = (videos.length / daySpan) * 7;
  const recentVideos = videos.filter(
    (v) => new Date(v.publishedAt).getTime() > lastDate.getTime() - 30 * 24 * 60 * 60 * 1000
  );
  const recentAvgViews = recentVideos.length > 0
    ? Math.round(recentVideos.reduce((s, v) => s + v.views, 0) / recentVideos.length)
    : 0;
  results.push(
    `${daySpan}일간 주 ${uploadsPerWeek.toFixed(1)}회 업로드. 최근 30일 평균 ${formatNumber(recentAvgViews)}회 — ${recentAvgViews > avgViews ? "상승세, 성장 모멘텀 확인" : "정체 구간, 콘텐츠 차별화 필요"}.`
  );

  // 10. 종합 액션플랜
  const topIssues: string[] = [];
  if (avgRetention !== null && avgRetention < 55) topIssues.push("인트로 후킹 강화");
  if (avgCTR < 5) topIssues.push("썸네일 A/B 테스트");
  if (avgWatchRatio < 0.35) topIssues.push("중반부 이탈 방지");
  if (subsPerView < 0.1) topIssues.push("CTA 위치 최적화");
  if (uploadsPerWeek < 3) topIssues.push("업로드 빈도 증가");
  if (topIssues.length === 0) topIssues.push("지표 유지 및 신규 포맷 실험");
  results.push(
    `액션플랜: ${topIssues.slice(0, 3).join(", ")} 우선. 상위 영상의 제목·썸네일·인트로 패턴을 템플릿화하여 전체 적용 권장.`
  );

  return results;
}

export function Insights({ videos }: InsightsProps) {
  const insights = useMemo(() => generateInsights(videos), [videos]);
  const [expanded, setExpanded] = useState(false);

  if (insights.length === 0) return null;

  const visibleInsights = expanded ? insights : insights.slice(0, 3);
  const hasMore = insights.length > 3;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.05] to-green-500/[0.08] backdrop-blur-xl px-5 py-4 shadow-lg shadow-emerald-500/[0.03]">
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
        <span className="text-sm font-semibold text-emerald-300/90 tracking-wide">Performance Insights</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {visibleInsights.map((text, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-white/85 leading-relaxed">
            <span className="text-emerald-400/60 mt-0.5 shrink-0 text-[10px]">{i + 1}.</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-emerald-500/10 text-[11px] text-emerald-400/70 hover:text-emerald-300 transition-colors"
        >
          <span>{expanded ? "접기" : "더보기"}</span>
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
