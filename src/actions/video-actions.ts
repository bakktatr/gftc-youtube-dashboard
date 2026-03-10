"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * 영상 카테고리 수동 업데이트
 */
export async function updateCategory(videoId: string, category: string) {
  await prisma.video.update({
    where: { id: videoId },
    data: {
      category,
      categoryManual: true,
      categoryConfidence: 1.0, // 수동 지정은 100% 신뢰도
    },
  });

  revalidatePath("/");
}

/**
 * 영상 카테고리 초기화 (AI 재분류 대상으로)
 */
export async function resetCategory(videoId: string) {
  await prisma.video.update({
    where: { id: videoId },
    data: {
      category: null,
      categoryManual: false,
      categoryConfidence: null,
    },
  });

  revalidatePath("/");
}

/**
 * 카테고리 목록 조회 (DB에서)
 */
export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * 카테고리 생성
 */
export async function createCategory(name: string, color: string) {
  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const category = await prisma.category.create({
    data: { name, color, sortOrder: nextOrder },
  });

  revalidatePath("/");
  return category;
}

/**
 * 카테고리 이름/색상 수정
 */
export async function updateCategoryInfo(
  id: string,
  data: { name?: string; color?: string }
) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error("카테고리를 찾을 수 없습니다");

  // 이름이 변경되면 해당 카테고리의 모든 비디오도 업데이트
  if (data.name && data.name !== existing.name) {
    await prisma.video.updateMany({
      where: { category: existing.name },
      data: { category: data.name },
    });
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  return updated;
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error("카테고리를 찾을 수 없습니다");

  // 해당 카테고리의 비디오들은 미분류로 변경
  await prisma.video.updateMany({
    where: { category: existing.name },
    data: { category: null, categoryManual: false, categoryConfidence: null },
  });

  await prisma.category.delete({ where: { id } });

  revalidatePath("/");
}

/**
 * Settings 업데이트
 */
export async function updateSettings(data: {
  anthropicKey?: string;
  syncInterval?: number;
  channelId?: string;
  channelName?: string;
}) {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...data,
    },
    update: data,
  });

  revalidatePath("/settings");
}
