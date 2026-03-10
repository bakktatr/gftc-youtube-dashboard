import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestTopics } from "@/lib/generators/topic-generator";
import type { ProductKey } from "@/lib/generators/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput, cta } = body as {
      userInput: string;
      cta: ProductKey;
    };

    // DB에서 기존 영상 제목 가져오기 (중복 방지용)
    const videos = await prisma.video.findMany({
      select: { title: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    const existingTitles = videos.map((v) => v.title);

    const topics = await suggestTopics({
      existingTitles,
      userInput: userInput || "",
      cta: cta || "lead_magnet",
    });

    return NextResponse.json({ success: true, topics });
  } catch (error) {
    console.error("주제 추천 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "주제 추천 실패",
      },
      { status: 500 }
    );
  }
}
