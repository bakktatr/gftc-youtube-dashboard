import { NextResponse } from "next/server";
import { runOrchestrator, runCategorizerOnly } from "@/agents/orchestrator";

/**
 * POST /api/sync
 * 수동 동기화 트리거
 * body: { mode: "full" | "categorize-only" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({ mode: "full" }));
    const mode = body.mode || "full";

    if (mode === "categorize-only") {
      const result = await runCategorizerOnly();
      return NextResponse.json({
        success: result.success,
        message: `${result.categorized}개 영상 분류 완료`,
        result,
      });
    }

    const result = await runOrchestrator();
    return NextResponse.json({
      success: result.success,
      message: `${result.collector?.videosUpdated ?? 0}개 영상 수집, ${result.categorizer?.categorized ?? 0}개 분류`,
      result,
    });
  } catch (error) {
    console.error("동기화 API 오류:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 * 마지막 동기화 상태 확인
 */
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      lastSync: lastSync
        ? {
            status: lastSync.status,
            videoCount: lastSync.videoCount,
            duration: lastSync.duration,
            error: lastSync.error,
            timestamp: lastSync.createdAt,
          }
        : null,
      syncInterval: settings?.syncInterval ?? 24,
      lastSyncAt: settings?.lastSyncAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
