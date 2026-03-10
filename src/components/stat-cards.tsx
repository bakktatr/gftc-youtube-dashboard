"use client";

import { useMemo } from "react";
import { formatNumber, formatDuration, formatCTR } from "@/lib/format";

interface VideoData {
  publishedAt: Date;
  views: number;
  subscriberChange: number;
  averageViewDuration: number;
  ctr: number;
}

interface StatCardsProps {
  videos: VideoData[];
}

export function StatCards({ videos }: StatCardsProps) {
  const thisMonth = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return videos.filter((v) => new Date(v.publishedAt) >= start);
  }, [videos]);

  const calc = (list: VideoData[]) => {
    const totalViews = list.reduce((sum, v) => sum + v.views, 0);
    const totalSubs = list.reduce((sum, v) => sum + v.subscriberChange, 0);
    const avgDuration =
      list.length > 0
        ? Math.round(list.reduce((sum, v) => sum + v.averageViewDuration, 0) / list.length)
        : 0;
    const avgCTR =
      list.length > 0
        ? list.reduce((sum, v) => sum + v.ctr, 0) / list.length
        : 0;
    return { totalViews, totalSubs, avgDuration, avgCTR };
  };

  const all = calc(videos);
  const month = calc(thisMonth);

  const stats = [
    {
      label: "총 조회수",
      value: formatNumber(all.totalViews),
      monthValue: formatNumber(month.totalViews),
      monthLabel: "이번달",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
    {
      label: "구독자 변동",
      value: `${all.totalSubs >= 0 ? "+" : ""}${formatNumber(all.totalSubs)}`,
      valueColor: all.totalSubs > 0 ? "text-emerald-400" : all.totalSubs < 0 ? "text-rose-400" : undefined,
      monthValue: `${month.totalSubs >= 0 ? "+" : ""}${formatNumber(month.totalSubs)}`,
      monthValueColor: month.totalSubs > 0 ? "text-emerald-400/70" : month.totalSubs < 0 ? "text-rose-400/70" : undefined,
      monthLabel: "이번달",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      label: "평균 시청시간",
      value: all.avgDuration > 0 ? formatDuration(all.avgDuration) : "—",
      monthValue: month.avgDuration > 0 ? formatDuration(month.avgDuration) : "—",
      monthLabel: "이번달",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: "평균 클릭률",
      value: all.avgCTR > 0 ? formatCTR(all.avgCTR) : "—",
      monthValue: month.avgCTR > 0 ? formatCTR(month.avgCTR) : "—",
      monthLabel: "이번달",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/[0.08] bg-[#141416] px-4 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-violet-500/10 text-violet-400">
              {stat.icon}
            </div>
            <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-xl font-semibold tracking-tight ${stat.valueColor || "text-white/90"}`}>
            {stat.value}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-white/30">{stat.monthLabel}</span>
            <span className={`text-xs font-medium ${stat.monthValueColor || "text-white/50"}`}>
              {stat.monthValue}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
