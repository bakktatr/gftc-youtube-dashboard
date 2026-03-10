import { prisma } from "@/lib/prisma";
import {
  checkErpLoginStatus,
  openErpLoginPage,
  closeErpBrowser,
} from "@/lib/scraper/erp-browser";
import { scrapeErpLeads } from "@/lib/scraper/erp-scraper";
import { matchLeadsToVideos, type LeadMatcherResult } from "./lead-matcher";

export interface ErpSyncResult {
  success: boolean;
  campaignsFound: number;
  videosUpdated: number;
  totalLeadsMatched: number;
  totalLeadsUnmatched: number;
  matcherResult: LeadMatcherResult | null;
  duration: number;
  errors: string[];
}

/**
 * ERP Lead Sync Agent
 *
 * Django Admin에서 리드 데이터를 수집하여 각 영상의 leadCount를 업데이트
 * 1. Django Admin 로그인 확인
 * 2. V1 + V2 리드 테이블 스크래핑
 * 3. 캠페인 → 영상 매칭
 * 4. DB leadCount 업데이트
 */
export async function runErpSync(): Promise<ErpSyncResult> {
  const startTime = Date.now();
  const result: ErpSyncResult = {
    success: false,
    campaignsFound: 0,
    videosUpdated: 0,
    totalLeadsMatched: 0,
    totalLeadsUnmatched: 0,
    matcherResult: null,
    duration: 0,
    errors: [],
  };

  console.log("═══════════════════════════════════════");
  console.log("🔄 ERP Lead Sync 시작");
  console.log(`📅 ${new Date().toLocaleString("ko-KR")}`);
  console.log("═══════════════════════════════════════\n");

  try {
    // Step 1: Django Admin 로그인 확인
    console.log("🔐 Django Admin 로그인 상태 확인...");
    const isLoggedIn = await checkErpLoginStatus();

    if (!isLoggedIn) {
      console.log("🔐 로그인이 필요합니다. 브라우저를 열겠습니다...");
      const loginSuccess = await openErpLoginPage();
      if (!loginSuccess) {
        result.errors.push("Django Admin 로그인 실패");
        return result;
      }
    }
    console.log("✅ Django Admin 로그인 확인 완료\n");

    // Step 2: 리드 테이블 스크래핑
    console.log("━━━ Step 1: 리드 데이터 수집 ━━━");
    const campaigns = await scrapeErpLeads();
    result.campaignsFound = campaigns.length;
    console.log(`\n📋 ${campaigns.length}개 캠페인 발견\n`);

    if (campaigns.length === 0) {
      result.errors.push(
        "YouTube UTM 캠페인을 찾지 못했습니다. Django Admin 페이지를 확인해주세요."
      );
      return result;
    }

    // Step 3: 리드 → 영상 매칭
    console.log("━━━ Step 2: 리드 매칭 ━━━");
    const matchResult = await matchLeadsToVideos(campaigns);
    result.matcherResult = matchResult;
    result.videosUpdated = matchResult.videosUpdated;
    result.totalLeadsMatched = matchResult.totalLeadsMatched;
    result.totalLeadsUnmatched = matchResult.totalLeadsUnmatched;

    if (matchResult.errors.length > 0) {
      result.errors.push(...matchResult.errors);
    }

    // Step 4: erpLastSyncAt 업데이트
    await prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default", erpLastSyncAt: new Date() },
      update: { erpLastSyncAt: new Date() },
    });

    result.success = matchResult.success;
  } catch (error) {
    result.errors.push(`ERP Sync error: ${error}`);
  } finally {
    result.duration = Date.now() - startTime;

    // 브라우저 정리
    try {
      await closeErpBrowser();
    } catch {
      // 무시
    }

    // 결과 요약
    console.log("\n═══════════════════════════════════════");
    console.log("📊 ERP Lead Sync 결과 요약");
    console.log(`  상태: ${result.success ? "✅ 성공" : "❌ 실패"}`);
    console.log(`  캠페인: ${result.campaignsFound}개`);
    console.log(`  매칭 리드: ${result.totalLeadsMatched}개`);
    console.log(`  미매칭 리드: ${result.totalLeadsUnmatched}개`);
    console.log(`  업데이트 영상: ${result.videosUpdated}개`);
    console.log(`  소요시간: ${(result.duration / 1000).toFixed(1)}초`);
    if (result.errors.length > 0) {
      console.log(`  에러: ${result.errors.length}건`);
      result.errors.forEach((e) => console.log(`    - ${e}`));
    }
    console.log("═══════════════════════════════════════");
  }

  return result;
}
