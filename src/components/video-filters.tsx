"use client";

import { useState } from "react";
import { getCategoryColorClass } from "@/lib/constants";

interface CategoryInfo {
  name: string;
  count: number;
}

interface DbCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export type DatePreset = "all" | "1w" | "1m" | "3m" | "custom";

interface VideoFiltersProps {
  categories: CategoryInfo[];
  dbCategories: DbCategory[];
  totalCount: number;
  selectedCategory: string | null;
  searchQuery: string;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  minViews: number;
  onCategoryChange: (category: string | null) => void;
  onSearchChange: (query: string) => void;
  onDatePresetChange: (preset: DatePreset) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onMinViewsChange: (views: number) => void;
  onManageCategories: () => void;
}

export function VideoFilters({
  categories,
  dbCategories,
  totalCount,
  selectedCategory,
  searchQuery,
  datePreset,
  dateFrom,
  dateTo,
  minViews,
  onCategoryChange,
  onSearchChange,
  onDatePresetChange,
  onDateFromChange,
  onDateToChange,
  onMinViewsChange,
  onManageCategories,
}: VideoFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // 최근 3개월 동적 계산
  const now = new Date();
  const recentMonths = [2, 1, 0].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${d.getMonth() + 1}월`,
      from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      to: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`,
    };
  });

  const handleMonthClick = (month: typeof recentMonths[number]) => {
    if (activeMonth === month.key) {
      // 토글 해제
      setActiveMonth(null);
      onDatePresetChange("all");
      onDateFromChange("");
      onDateToChange("");
    } else {
      setActiveMonth(month.key);
      onDatePresetChange("custom");
      onDateFromChange(month.from);
      onDateToChange(month.to);
    }
  };

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: "all", label: "전체 기간" },
    { key: "1w", label: "이번주" },
    { key: "1m", label: "최근 1개월" },
    { key: "3m", label: "최근 3개월" },
    { key: "custom", label: "직접 설정" },
  ];

  const viewPresets = [
    { label: "전체", value: 0 },
    { label: "1,000+", value: 1000 },
    { label: "3,000+", value: 3000 },
    { label: "5,000+", value: 5000 },
  ];

  const hasActiveFilters =
    selectedCategory !== null ||
    searchQuery.trim() !== "" ||
    datePreset !== "all";

  const clearAllFilters = () => {
    onCategoryChange(null);
    onSearchChange("");
    onDatePresetChange("all");
    onDateFromChange("");
    onDateToChange("");
    setActiveMonth(null);
  };

  // Build a color lookup from DB categories
  const colorMap = new Map(dbCategories.map((c) => [c.name, c.color]));

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Advanced toggle + Clear */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            placeholder="영상 제목 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm rounded-xl bg-white/[0.04] backdrop-blur-lg border border-white/[0.08] text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 focus:bg-white/[0.06] transition-all shadow-sm"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
            showAdvanced || datePreset !== "all" || selectedCategory !== null
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
              : "bg-white/[0.05] text-white/60 border border-white/[0.1] hover:bg-white/[0.07] hover:text-white/80 shadow-sm"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          필터
          {(datePreset !== "all" || selectedCategory !== null) && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        {/* 최근 3개월 버튼 */}
        <div className="flex items-center gap-4">
          {recentMonths.map((month) => (
            <button
              key={month.key}
              onClick={() => handleMonthClick(month)}
              className={`h-9 px-5 rounded-xl text-xs font-medium transition-all duration-200 ${
                activeMonth === month.key
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  : "bg-white/[0.05] text-white/60 border border-white/[0.1] hover:bg-white/[0.07] hover:text-white/80 shadow-sm"
              }`}
            >
              {month.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="h-9 px-3 rounded-xl text-xs font-medium text-white/50 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all duration-200 shadow-sm"
          >
            초기화
          </button>
        )}
      </div>

      {/* Row 2: Advanced filters (collapsible) */}
      {showAdvanced && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-xl p-4 space-y-4 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Category */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/55">
              카테고리
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onCategoryChange(null)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  selectedCategory === null
                    ? "bg-white/12 text-white border border-white/20"
                    : "bg-white/[0.05] text-white/60 border border-white/[0.1] hover:bg-white/[0.07] hover:text-white/80"
                }`}
              >
                전체
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const color = colorMap.get(cat.name) || "slate";
                const colorClass = getCategoryColorClass(color);

                return (
                  <button
                    key={cat.name}
                    onClick={() =>
                      onCategoryChange(isSelected ? null : cat.name)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${colorClass} ${
                      isSelected
                        ? "shadow-sm ring-1 ring-white/20 brightness-125"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}

              {/* Manage categories button */}
              <button
                onClick={onManageCategories}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-white/35 hover:text-white/50 hover:bg-white/[0.04] transition-all duration-200"
                title="카테고리 관리"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-white/55">
              기간
            </label>
            <div className="flex items-center gap-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => { setActiveMonth(null); onDatePresetChange(preset.key); }}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    datePreset === preset.key
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                      : "bg-white/[0.05] text-white/60 border border-white/[0.1] hover:bg-white/[0.07] hover:text-white/80 shadow-sm"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="h-8 px-3 rounded-xl text-xs bg-white/[0.04] border border-white/[0.06] text-white/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition-all shadow-sm"
                />
                <span className="text-white/35 text-xs">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="h-8 px-3 rounded-xl text-xs bg-white/[0.04] border border-white/[0.06] text-white/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition-all shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
