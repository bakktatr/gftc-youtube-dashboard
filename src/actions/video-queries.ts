"use server";

import { prisma } from "@/lib/prisma";

export type SortField =
  | "publishedAt"
  | "views"
  | "subscribers"
  | "averageViewDuration"
  | "ctr"
  | "retention30s"
  | "leadCount"
  | "title"
  | "category";

export type SortOrder = "asc" | "desc";

export interface VideoFilters {
  category?: string | null;
  search?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export async function getVideos(filters?: VideoFilters) {
  const {
    category,
    search,
    sortBy = "publishedAt",
    sortOrder = "desc",
  } = filters || {};

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.title = { contains: search };
  }

  // 구독자 변동 정렬은 계산 필드이므로 별도 처리
  const orderBy =
    sortBy === "subscribers"
      ? { subscribersGained: sortOrder as "asc" | "desc" }
      : { [sortBy]: sortOrder };

  const videos = await prisma.video.findMany({
    where,
    orderBy,
  });

  return videos.map((v) => ({
    id: v.id,
    videoId: v.videoId,
    title: v.title,
    publishedAt: v.publishedAt,
    views: v.views,
    subscriberChange: v.subscribersGained - v.subscribersLost,
    subscribersGained: v.subscribersGained,
    subscribersLost: v.subscribersLost,
    averageViewDuration: v.averageViewDuration,
    ctr: v.ctr,
    retention30s: v.retention30s,
    category: v.category,
    categoryConfidence: v.categoryConfidence,
    categoryManual: v.categoryManual,
    duration: v.duration,
    leadCount: v.leadCount,
    lastSyncAt: v.lastSyncAt,
  }));
}

export async function getVideoStats() {
  const totalVideos = await prisma.video.count();
  const categorizedVideos = await prisma.video.count({
    where: { category: { not: null } },
  });
  const totalViews = await prisma.video.aggregate({
    _sum: { views: true },
  });
  const avgCtr = await prisma.video.aggregate({
    _avg: { ctr: true },
  });

  return {
    totalVideos,
    categorizedVideos,
    totalViews: totalViews._sum.views ?? 0,
    avgCtr: avgCtr._avg.ctr ?? 0,
  };
}

export async function getCategories() {
  const categories = await prisma.video.groupBy({
    by: ["category"],
    _count: { id: true },
    where: { category: { not: null } },
    orderBy: { _count: { id: "desc" } },
  });

  return categories.map((c) => ({
    name: c.category!,
    count: c._count.id,
  }));
}

export async function getLastSyncInfo() {
  const lastSync = await prisma.syncLog.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  return {
    lastSync,
    settings,
  };
}
