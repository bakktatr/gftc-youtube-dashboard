import { NextResponse } from "next/server";
import { runErpSync } from "@/agents/erp-sync";

/**
 * POST /api/erp-sync
 * ERP 리드 동기화 트리거
 */
export async function POST() {
  try {
    const result = await runErpSync();
    return NextResponse.json({
      success: result.success,
      message: `${result.totalLeadsMatched}개 리드 매칭, ${result.videosUpdated}개 영상 업데이트`,
      result,
    });
  } catch (error) {
    console.error("ERP 동기화 API 오류:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/erp-sync
 * ERP 동기화 상태 확인
 */
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    return NextResponse.json({
      erpLastSyncAt: settings?.erpLastSyncAt ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
