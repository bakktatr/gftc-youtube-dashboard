import { prisma } from "@/lib/prisma";
import { runDataCollector, type CollectorResult } from "./data-collector";
import { runCategorizer, type CategorizerResult } from "./categorizer";

export interface OrchestratorResult {
  success: boolean;
  collector: CollectorResult | null;
  categorizer: CategorizerResult | null;
  totalDuration: number; // ms
  timestamp: Date;
}

/**
 * Orchestrator Agent
 *
 * Data Collector → Categorizer 순서로 에이전트를 실행하고
 * 결과를 SyncLog에 기록하는 오케스트레이터
 */
export async function runOrchestrator(): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const result: OrchestratorResult = {
    success: false,
    collector: null,
    categorizer: null,
    totalDuration: 0,
    timestamp: new Date(),
  };

  console.log("═══════════════════════════════════════");
  console.log("🎯 Orchestrator 시작");
  console.log(`📅 ${new Date().toLocaleString("ko-KR")}`);
  console.log("═══════════════════════════════════════\n");

  try {
    // Step 1: Data Collector 실행
    console.log("━━━ Step 1: Data Collector ━━━");
    result.collector = await runDataCollector();
    console.log("");

    // Step 2: Categorizer 실행 (데이터 수집 후)
    console.log("━━━ Step 2: Categorizer ━━━");
    result.categorizer = await runCategorizer();
    console.log("");

    // 전체 결과 판단
    result.success =
      (result.collector?.success ?? false) &&
      (result.categorizer?.success ?? false);

    // SyncLog 기록
    const duration = Date.now() - startTime;
    result.totalDuration = duration;

    const allErrors = [
      ...(result.collector?.errors ?? []),
      ...(result.categorizer?.errors ?? []),
    ];

    await prisma.syncLog.create({
      data: {
        status: result.success
          ? "success"
          : allErrors.length > 0
            ? "partial"
            : "error",
        videoCount: result.collector?.videosUpdated ?? 0,
        duration,
        error: allErrors.length > 0 ? allErrors.join("; ") : null,
      },
    });

    // Settings의 lastSyncAt 업데이트
    await prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default", lastSyncAt: new Date() },
      update: { lastSyncAt: new Date() },
    });

    // 결과 요약
    console.log("═══════════════════════════════════════");
    console.log("📊 Orchestrator 결과 요약");
    console.log(`  상태: ${result.success ? "✅ 성공" : "⚠️ 부분 성공"}`);
    console.log(
      `  수집: ${result.collector?.videosUpdated ?? 0}/${result.collector?.videosFound ?? 0}개 영상`
    );
    console.log(
      `  분류: ${result.categorizer?.categorized ?? 0}개 분류, ${result.categorizer?.skipped ?? 0}개 건너뜀`
    );
    console.log(`  소요시간: ${(duration / 1000).toFixed(1)}초`);
    if (allErrors.length > 0) {
      console.log(`  에러: ${allErrors.length}건`);
      allErrors.forEach((e) => console.log(`    - ${e}`));
    }
    console.log("═══════════════════════════════════════");
  } catch (error) {
    const duration = Date.now() - startTime;
    result.totalDuration = duration;

    console.error(`\n❌ Orchestrator 치명적 오류: ${error}`);

    await prisma.syncLog.create({
      data: {
        status: "error",
        videoCount: 0,
        duration,
        error: `Orchestrator error: ${error}`,
      },
    });
  }

  return result;
}

/**
 * Categorizer만 단독 실행 (데이터 수집 없이 분류만)
 */
export async function runCategorizerOnly(): Promise<CategorizerResult> {
  console.log("🤖 Categorizer 단독 실행...\n");
  const result = await runCategorizer();
  return result;
}

/**
 * Data Collector만 단독 실행 (분류 없이 수집만)
 */
export async function runCollectorOnly(): Promise<CollectorResult> {
  console.log("📋 Data Collector 단독 실행...\n");
  const result = await runDataCollector();
  return result;
}
