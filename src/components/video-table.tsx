"use client";

import { useMemo } from "react";
import { CategorySelect } from "@/components/category-select";
import {
  formatNumber,
  formatDuration,
  formatCTR,
  formatRetention,
  formatDate,
} from "@/lib/format";
import type { SortField, SortOrder } from "@/actions/video-queries";

interface VideoData {
  id: string;
  videoId: string;
  title: string;
  publishedAt: Date;
  views: number;
  subscriberChange: number;
  subscribersGained: number;
  subscribersLost: number;
  averageViewDuration: number;
  ctr: number;
  retention30s: number | null;
  category: string | null;
  categoryConfidence: number | null;
  categoryManual: boolean;
  leadCount: number;
}

interface DbCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface VideoTableProps {
  videos: VideoData[];
  dbCategories: DbCategory[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export function VideoTable({ videos, dbCategories, sortBy, sortOrder, onSort }: VideoTableProps) {
  // 합계/평균 계산
  const totals = useMemo(() => {
    if (videos.length === 0) return null;

    const totalViews = videos.reduce((s, v) => s + v.views, 0);
    const totalSubs = videos.reduce((s, v) => s + v.subscriberChange, 0);
    const totalLeads = videos.reduce((s, v) => s + v.leadCount, 0);

    const videosWithDuration = videos.filter((v) => v.averageViewDuration > 0);
    const avgDuration =
      videosWithDuration.length > 0
        ? Math.round(
            videosWithDuration.reduce((s, v) => s + v.averageViewDuration, 0) /
              videosWithDuration.length
          )
        : 0;

    const videosWithCtr = videos.filter((v) => v.ctr > 0);
    const avgCtr =
      videosWithCtr.length > 0
        ? videosWithCtr.reduce((s, v) => s + v.ctr, 0) / videosWithCtr.length
        : 0;

    const videosWithRetention = videos.filter((v) => v.retention30s !== null);
    const avgRetention =
      videosWithRetention.length > 0
        ? videosWithRetention.reduce((s, v) => s + (v.retention30s ?? 0), 0) /
          videosWithRetention.length
        : null;

    return { totalViews, totalSubs, avgDuration, avgCtr, avgRetention, totalLeads };
  }, [videos]);

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortBy === field;
    const isLeft = className.includes("text-left");
    return (
      <th
        className={`h-10 align-middle font-medium text-sm cursor-pointer select-none transition-colors whitespace-nowrap ${
          field === "title" ? "pl-6 pr-3" : field === "category" ? "pl-3 pr-6" : "px-3"
        } ${
          isActive
            ? "text-emerald-300"
            : "text-white/70 hover:text-white/90"
        } ${className}`}
        onClick={() => onSort(field)}
      >
        <div className={`flex items-center gap-1 ${isLeft ? "justify-start" : "justify-center"}`}>
          {children}
          {isActive && (
            <svg
              className={`h-3 w-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          )}
        </div>
      </th>
    );
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/25">
        <svg className="h-12 w-12 mb-4 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p className="text-sm font-medium text-white/40">영상 데이터가 없습니다</p>
        <p className="text-xs mt-1 text-white/25">
          동기화를 실행하거나 데이터를 가져와주세요
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.12] bg-white/[0.06]">
              <SortableHeader field="title" className="text-left min-w-[320px]">
                제목
              </SortableHeader>
              <SortableHeader field="views" className="text-center w-[90px]">
                조회수
              </SortableHeader>
              <SortableHeader field="subscribers" className="text-center w-[70px]">
                구독자
              </SortableHeader>
              <SortableHeader field="averageViewDuration" className="text-center w-[80px]">
                시청시간
              </SortableHeader>
              <SortableHeader field="ctr" className="text-center w-[70px]">
                클릭률
              </SortableHeader>
              <SortableHeader field="retention30s" className="text-center w-[80px]">
                30초 잔존
              </SortableHeader>
              <SortableHeader field="leadCount" className="text-center w-[60px]">
                리드
              </SortableHeader>
              <SortableHeader field="publishedAt" className="text-center w-[100px]">
                날짜
              </SortableHeader>
              <SortableHeader field="category" className="text-center w-[140px]">
                카테고리
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.1]">
            {videos.map((video, index) => (
              <tr
                key={video.id}
                className="group transition-all duration-200 hover:bg-emerald-500/[0.04]"
              >
                {/* Title */}
                <td className="pl-6 pr-3 py-2.5 max-w-[420px]">
                  <a
                    href={`https://youtu.be/${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-emerald-300 transition-colors line-clamp-1"
                    title={video.title}
                  >
                    {video.title}
                  </a>
                </td>

                {/* Views */}
                <td className="px-3 py-2.5 text-center text-sm text-white">
                  {formatNumber(video.views)}
                </td>

                {/* Subscriber change */}
                <td className="px-3 py-2.5 text-center text-sm">
                  <span
                    className={
                      video.subscriberChange > 0
                        ? "text-emerald-400"
                        : video.subscriberChange < 0
                          ? "text-rose-400"
                          : "text-white/35"
                    }
                  >
                    {video.subscriberChange > 0 ? "+" : ""}
                    {video.subscriberChange}
                  </span>
                </td>

                {/* Watch time */}
                <td className="px-3 py-2.5 text-center text-sm text-white/90">
                  {video.averageViewDuration > 0
                    ? formatDuration(video.averageViewDuration)
                    : "—"}
                </td>

                {/* CTR */}
                <td className="px-3 py-2.5 text-center text-sm text-white/90">
                  {video.ctr > 0 ? formatCTR(video.ctr) : "—"}
                </td>

                {/* 30s retention */}
                <td className="px-3 py-2.5 text-center text-sm text-white/90">
                  {formatRetention(video.retention30s)}
                </td>

                {/* Lead count */}
                <td className="px-3 py-2.5 text-center text-sm">
                  {video.leadCount > 0 ? (
                    <span className="text-amber-400 font-medium">{video.leadCount}</span>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-3 py-2.5 text-center text-xs text-white/85">
                  {formatDate(video.publishedAt)}
                </td>

                {/* Category */}
                <td className="pl-3 pr-6 py-2.5 text-center">
                  <CategorySelect
                    videoId={video.id}
                    currentCategory={video.category}
                    confidence={video.categoryConfidence}
                    isManual={video.categoryManual}
                    dbCategories={dbCategories}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t border-white/[0.15] bg-white/[0.06]">
                {/* Label */}
                <td className="pl-6 pr-3 py-3">
                  <span className="text-sm font-semibold text-white/60">
                    합계 / 평균
                    <span className="ml-2 text-xs font-normal text-white/30">
                      ({videos.length}개 영상)
                    </span>
                  </span>
                </td>

                {/* Total Views */}
                <td className="px-3 py-3 text-center text-sm font-semibold text-white">
                  {formatNumber(totals.totalViews)}
                </td>

                {/* Total Subscribers */}
                <td className="px-3 py-3 text-center text-sm font-semibold">
                  <span
                    className={
                      totals.totalSubs > 0
                        ? "text-emerald-400"
                        : totals.totalSubs < 0
                          ? "text-rose-400"
                          : "text-white/35"
                    }
                  >
                    {totals.totalSubs > 0 ? "+" : ""}
                    {formatNumber(totals.totalSubs)}
                  </span>
                </td>

                {/* Avg Duration */}
                <td className="px-3 py-3 text-center text-sm font-semibold text-white/90">
                  {totals.avgDuration > 0 ? formatDuration(totals.avgDuration) : "—"}
                </td>

                {/* Avg CTR */}
                <td className="px-3 py-3 text-center text-sm font-semibold text-white/90">
                  {totals.avgCtr > 0 ? formatCTR(totals.avgCtr) : "—"}
                </td>

                {/* Avg 30s Retention */}
                <td className="px-3 py-3 text-center text-sm font-semibold text-white/90">
                  {formatRetention(totals.avgRetention)}
                </td>

                {/* Total Leads */}
                <td className="px-3 py-3 text-center text-sm font-semibold">
                  {totals.totalLeads > 0 ? (
                    <span className="text-amber-400">{formatNumber(totals.totalLeads)}</span>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </td>

                {/* Date - empty */}
                <td className="px-3 py-3" />

                {/* Category - empty */}
                <td className="pl-3 pr-6 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
