import { prisma } from "@/lib/prisma";
import {
  scrapeVideoList,
  scrapeVideoAnalytics,
  type ScrapedVideo,
} from "@/lib/scraper/studio-scraper";
import {
  checkLoginStatus,
  openLoginPage,
} from "@/lib/scraper/browser";

export interface CollectorResult {
  success: boolean;
  videosFound: number;
  videosUpdated: number;
  errors: string[];
}

/**
 * Data Collector Agent
 *
 * YouTube Studio에서 영상 데이터를 수집하여 DB에 저장하는 에이전트
 * 1. YouTube Studio 로그인 확인
 * 2. Content 페이지에서 영상 목록 수집
 * 3. 각 영상의 Analytics 페이지에서 상세 지표 수집
 * 4. DB에 upsert (새 영상은 추가, 기존 영상은 업데이트)
 */
export async function runDataCollector(): Promise<CollectorResult> {
  const result: CollectorResult = {
    success: false,
    videosFound: 0,
    videosUpdated: 0,
    errors: [],
  };

  console.log("🚀 Data Collector Agent 시작...");

  try {
    // Step 1: 로그인 확인
    console.log("🔐 YouTube Studio 로그인 상태 확인...");
    const isLoggedIn = await checkLoginStatus();

    if (!isLoggedIn) {
      console.log("🔐 로그인이 필요합니다. 브라우저를 열겠습니다...");
      const loginSuccess = await openLoginPage();
      if (!loginSuccess) {
        result.errors.push("YouTube Studio 로그인 실패");
        return result;
      }
    }

    console.log("✅ 로그인 확인 완료");

    // Step 2: 영상 목록 수집
    console.log("📋 영상 목록 수집 중...");
    const videos = await scrapeVideoList();
    result.videosFound = videos.length;
    console.log(`📋 ${videos.length}개 영상 발견`);

    if (videos.length === 0) {
      result.errors.push(
        "영상을 찾지 못했습니다. YouTube Studio 페이지 구조가 변경되었을 수 있습니다."
      );
      return result;
    }

    // Step 3: 각 영상의 Analytics 수집 및 DB 저장
    console.log("📊 영상별 Analytics 수집 중...");

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(
        `  [${i + 1}/${videos.length}] ${video.title.substring(0, 40)}...`
      );

      try {
        // Analytics 데이터 수집
        const analytics = await scrapeVideoAnalytics(video.videoId);

        // DB에 upsert
        const publishedAt = parseKoreanDate(video.publishedAt);

        await prisma.video.upsert({
          where: { videoId: video.videoId },
          create: {
            videoId: video.videoId,
            title: video.title,
            publishedAt: publishedAt || new Date(),
            views: analytics?.views ?? video.views,
            subscribersGained: analytics?.subscribersGained ?? 0,
            subscribersLost: analytics?.subscribersLost ?? 0,
            averageViewDuration: analytics?.averageViewDuration ?? 0,
            ctr: analytics?.ctr ?? 0,
            retention30s: analytics?.retention30s ?? null,
            lastSyncAt: new Date(),
          },
          update: {
            title: video.title,
            views: analytics?.views ?? video.views,
            subscribersGained: analytics?.subscribersGained ?? 0,
            subscribersLost: analytics?.subscribersLost ?? 0,
            averageViewDuration: analytics?.averageViewDuration ?? 0,
            ctr: analytics?.ctr ?? 0,
            retention30s: analytics?.retention30s ?? null,
            lastSyncAt: new Date(),
            // 카테고리는 업데이트하지 않음 (수동/AI 분류 보존)
          },
        });

        result.videosUpdated++;

        // Rate limiting: YouTube Studio가 봇 감지하지 않도록 딜레이
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        const errMsg = `영상 ${video.videoId} 처리 실패: ${error}`;
        console.error(`  ❌ ${errMsg}`);
        result.errors.push(errMsg);
      }
    }

    result.success = result.errors.length === 0;
    console.log(
      `\n✅ Data Collector 완료: ${result.videosUpdated}/${result.videosFound}개 영상 업데이트`
    );
  } catch (error) {
    const errMsg = `Data Collector 오류: ${error}`;
    console.error(`❌ ${errMsg}`);
    result.errors.push(errMsg);
  }

  return result;
}

/**
 * 한국어 날짜 문자열을 Date 객체로 파싱
 * "2026. 1. 2" → Date
 * "2026년 1월 2일" → Date
 * "2026-01-02" → Date
 */
function parseKoreanDate(dateStr: string): Date | null {
  try {
    // "2026. 1. 2" 형식
    const match1 = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (match1) {
      return new Date(
        parseInt(match1[1]),
        parseInt(match1[2]) - 1,
        parseInt(match1[3])
      );
    }

    // "2026년 1월 2일" 형식
    const match2 = dateStr.match(
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/
    );
    if (match2) {
      return new Date(
        parseInt(match2[1]),
        parseInt(match2[2]) - 1,
        parseInt(match2[3])
      );
    }

    // ISO 형식
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}
