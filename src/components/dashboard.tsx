"use client";

import { useState, useMemo } from "react";
import { VideoTable } from "@/components/video-table";
import { VideoFilters, type DatePreset } from "@/components/video-filters";
import { Insights } from "@/components/insights";
import { SyncButton } from "@/components/sync-button";
import { ErpSyncButton } from "@/components/erp-sync-button";
import { CategoryManager } from "@/components/category-manager";
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
  duration: number;
  leadCount: number;
}

interface CategoryInfo {
  name: string;
  count: number;
}

interface DbCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardProps {
  initialVideos: VideoData[];
  categories: CategoryInfo[];
  dbCategories: DbCategory[];
  lastSyncAt: Date | null;
  erpLastSyncAt: Date | null;
}

function getDateFromPreset(preset: DatePreset): Date | null {
  if (preset === "all") return null;
  const now = new Date();
  if (preset === "1w") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday as start of week
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  if (preset === "1m") {
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  if (preset === "3m") {
    return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  }
  return null;
}

export function Dashboard({
  initialVideos,
  categories,
  dbCategories,
  lastSyncAt,
  erpLastSyncAt,
}: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("publishedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Views filter state
  const [minViews, setMinViews] = useState(0);

  const filteredVideos = useMemo(() => {
    let filtered = initialVideos;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((v) =>
        v.title.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (datePreset === "custom") {
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter(
          (v) => new Date(v.publishedAt) >= from
        );
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(
          (v) => new Date(v.publishedAt) <= to
        );
      }
    } else {
      const presetDate = getDateFromPreset(datePreset);
      if (presetDate) {
        filtered = filtered.filter(
          (v) => new Date(v.publishedAt) >= presetDate
        );
      }
    }

    // Min views filter
    if (minViews > 0) {
      filtered = filtered.filter((v) => v.views >= minViews);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: number | string | Date | null;
      let bVal: number | string | Date | null;

      switch (sortBy) {
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        case "views":
          aVal = a.views;
          bVal = b.views;
          break;
        case "subscribers":
          aVal = a.subscriberChange;
          bVal = b.subscriberChange;
          break;
        case "averageViewDuration":
          aVal = a.averageViewDuration;
          bVal = b.averageViewDuration;
          break;
        case "ctr":
          aVal = a.ctr;
          bVal = b.ctr;
          break;
        case "retention30s":
          aVal = a.retention30s ?? -1;
          bVal = b.retention30s ?? -1;
          break;
        case "publishedAt":
          aVal = new Date(a.publishedAt).getTime();
          bVal = new Date(b.publishedAt).getTime();
          break;
        case "leadCount":
          aVal = a.leadCount;
          bVal = b.leadCount;
          break;
        case "category":
          aVal = a.category ?? "";
          bVal = b.category ?? "";
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal, "ko")
          : bVal.localeCompare(aVal, "ko");
      }

      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    return filtered;
  }, [initialVideos, selectedCategory, searchQuery, sortBy, sortOrder, datePreset, dateFrom, dateTo, minViews]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
          GFTC YouTube Analytics
        </h1>
        <div className="flex items-center gap-4">
          <ErpSyncButton lastSyncAt={erpLastSyncAt} />
          <SyncButton lastSyncAt={lastSyncAt} />
        </div>
      </div>

      {/* Insights */}
      <Insights videos={initialVideos} />

      {/* Filters */}
      <VideoFilters
        categories={categories}
        dbCategories={dbCategories}
        totalCount={initialVideos.length}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        datePreset={datePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        minViews={minViews}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        onDatePresetChange={setDatePreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onMinViewsChange={setMinViews}
        onManageCategories={() => setShowCategoryManager(true)}
      />

      {/* Table */}
      <VideoTable
        videos={filteredVideos}
        dbCategories={dbCategories}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        categories={dbCategories}
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </div>
  );
}
