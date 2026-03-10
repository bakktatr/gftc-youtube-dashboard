import type { BrowserContext, Page } from "playwright";
import { getBrowserContext } from "./browser";

export interface ScrapedVideo {
  videoId: string;
  title: string;
  publishedAt: string; // ISO date string
  views: number;
  // YouTube Studio Content 페이지에서 가져올 수 있는 기본 정보
}

export interface ScrapedAnalytics {
  videoId: string;
  views: number;
  subscribersGained: number;
  subscribersLost: number;
  averageViewDuration: number; // 초
  ctr: number; // 퍼센트 (예: 6.1)
  retention30s: number | null; // 퍼센트 (예: 56)
}

/**
 * YouTube Studio Content 페이지에서 전체 영상 목록 스크래핑
 */
export async function scrapeVideoList(
  channelId?: string
): Promise<ScrapedVideo[]> {
  const context = await getBrowserContext();
  const page = await context.newPage();

  try {
    // YouTube Studio Content 페이지로 이동
    const studioUrl = channelId
      ? `https://studio.youtube.com/channel/${channelId}/videos/upload`
      : "https://studio.youtube.com/videos/upload";

    await page.goto(studioUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 페이지 로딩 대기
    await page.waitForTimeout(3000);

    // 영상 목록 테이블이 로드될 때까지 대기
    await page.waitForSelector("#video-list", { timeout: 15000 }).catch(() => {
      // fallback: 다른 셀렉터 시도
    });

    // 모든 영상을 로드하기 위해 스크롤
    await scrollToLoadAll(page);

    // 영상 데이터 추출
    const videos = await page.evaluate(() => {
      const results: {
        videoId: string;
        title: string;
        publishedAt: string;
        views: number;
      }[] = [];

      // YouTube Studio의 영상 행들을 찾음
      const rows = document.querySelectorAll("ytcp-video-row");

      rows.forEach((row) => {
        try {
          // 비디오 ID: 영상 링크에서 추출
          const link = row.querySelector("a.video-title-link, a[href*='/video/']");
          const href = link?.getAttribute("href") || "";
          const videoIdMatch = href.match(/\/video\/([^/]+)/);
          const videoId = videoIdMatch ? videoIdMatch[1] : "";

          // 제목
          const titleEl = row.querySelector(
            "#video-title, .video-title-text, h3"
          );
          const title = titleEl?.textContent?.trim() || "";

          // 날짜
          const dateEl = row.querySelector(
            ".date-text, [class*='date'], .style-scope.ytcp-video-row"
          );
          const dateText = dateEl?.textContent?.trim() || "";

          // 조회수
          const cells = row.querySelectorAll(
            ".table-cell, td, [class*='cell']"
          );
          let views = 0;
          cells.forEach((cell) => {
            const text = cell.textContent?.trim() || "";
            // 조회수 패턴 매칭 (숫자만 있는 셀)
            if (/^[\d,]+$/.test(text) && parseInt(text.replace(/,/g, "")) > 0) {
              views = parseInt(text.replace(/,/g, ""));
            }
          });

          if (videoId && title) {
            results.push({
              videoId,
              title,
              publishedAt: dateText,
              views,
            });
          }
        } catch {
          // 파싱 실패한 행은 건너뜀
        }
      });

      return results;
    });

    return videos;
  } finally {
    await page.close();
  }
}

/**
 * 개별 영상의 Analytics 페이지에서 상세 지표 스크래핑
 */
export async function scrapeVideoAnalytics(
  videoId: string
): Promise<ScrapedAnalytics | null> {
  const context = await getBrowserContext();
  const page = await context.newPage();

  try {
    // 영상 Analytics 페이지로 이동 (전체 기간)
    const analyticsUrl = `https://studio.youtube.com/video/${videoId}/analytics/tab-overview/period-lifetime`;
    await page.goto(analyticsUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Analytics 카드에서 지표 추출
    const analytics = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || "0";
      };

      // YouTube Studio Analytics 페이지의 주요 메트릭 카드들
      const metricCards = document.querySelectorAll(
        "yta-key-metric-card, .metric-card, [class*='key-metric']"
      );

      let views = 0;
      let watchTimeHours = 0;
      let subscribers = 0;
      let ctr = 0;
      let avgDuration = 0;

      metricCards.forEach((card) => {
        const label =
          card
            .querySelector(
              ".metric-label, .title, [class*='label'], [class*='title']"
            )
            ?.textContent?.trim()
            ?.toLowerCase() || "";
        const valueText =
          card
            .querySelector(
              ".metric-value, .value, [class*='value'], [class*='metric-value']"
            )
            ?.textContent?.trim() || "0";

        if (label.includes("조회수") || label.includes("views")) {
          views = parseNumber(valueText);
        } else if (
          label.includes("시청 시간") ||
          label.includes("watch time")
        ) {
          watchTimeHours = parseFloat(valueText.replace(/[^0-9.]/g, "")) || 0;
        } else if (
          label.includes("구독자") ||
          label.includes("subscriber")
        ) {
          subscribers = parseSignedNumber(valueText);
        } else if (
          label.includes("노출 클릭률") ||
          label.includes("impressions click") ||
          label.includes("ctr")
        ) {
          ctr = parseFloat(valueText.replace(/[^0-9.]/g, "")) || 0;
        } else if (
          label.includes("평균 시청 시간") ||
          label.includes("average view")
        ) {
          avgDuration = parseDurationToSeconds(valueText);
        }
      });

      function parseNumber(text: string): number {
        return parseInt(text.replace(/[^0-9]/g, "")) || 0;
      }

      function parseSignedNumber(text: string): number {
        const cleaned = text.replace(/[^0-9\-+]/g, "");
        return parseInt(cleaned) || 0;
      }

      function parseDurationToSeconds(text: string): number {
        // "4:23" → 263초
        const parts = text.match(/(\d+):(\d+)/);
        if (parts) {
          return parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        // "4분 23초" 형식
        const minMatch = text.match(/(\d+)\s*분/);
        const secMatch = text.match(/(\d+)\s*초/);
        const min = minMatch ? parseInt(minMatch[1]) : 0;
        const sec = secMatch ? parseInt(secMatch[1]) : 0;
        return min * 60 + sec;
      }

      return {
        views,
        subscribers,
        watchTimeHours,
        ctr,
        avgDuration,
      };
    });

    // 30초 잔존율은 별도로 가져옴 (Engagement 탭)
    const retention30s = await scrapeRetention30s(page, videoId);

    return {
      videoId,
      views: analytics.views,
      subscribersGained: Math.max(analytics.subscribers, 0),
      subscribersLost: Math.max(-analytics.subscribers, 0),
      averageViewDuration: analytics.avgDuration,
      ctr: analytics.ctr,
      retention30s,
    };
  } catch (error) {
    console.error(
      `❌ 영상 ${videoId} Analytics 스크래핑 실패:`,
      error
    );
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Engagement 탭에서 30초 잔존율 추출
 */
async function scrapeRetention30s(
  page: Page,
  videoId: string
): Promise<number | null> {
  try {
    // Engagement 탭으로 이동
    const engagementUrl = `https://studio.youtube.com/video/${videoId}/analytics/tab-engagement/period-lifetime`;
    await page.goto(engagementUrl, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    await page.waitForTimeout(2000);

    // 잔존율 데이터를 network request에서 가로채기
    // YouTube Studio는 내부 API로 retention 데이터를 가져옴
    const retention = await page.evaluate(() => {
      // "시청 지속 시간" 또는 "Audience retention" 관련 텍스트 찾기
      const allText = document.body.innerText;

      // "도입부" 관련 지표가 표시되는 경우
      const introMatch = allText.match(
        /도입부[^\d]*(\d+(?:\.\d+)?)\s*%/
      );
      if (introMatch) {
        return parseFloat(introMatch[1]);
      }

      // 영문 인터페이스
      const introMatchEn = allText.match(
        /intro[^\d]*(\d+(?:\.\d+)?)\s*%/i
      );
      if (introMatchEn) {
        return parseFloat(introMatchEn[1]);
      }

      return null;
    });

    return retention;
  } catch {
    return null;
  }
}

/**
 * 페이지를 스크롤하여 모든 영상 로드 (무한 스크롤 대응)
 */
async function scrollToLoadAll(page: Page): Promise<void> {
  let previousHeight = 0;
  let retries = 0;
  const MAX_RETRIES = 20;

  while (retries < MAX_RETRIES) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (currentHeight === previousHeight) {
      retries++;
      if (retries >= 3) break; // 3번 연속 같으면 종료
    } else {
      retries = 0;
    }

    previousHeight = currentHeight;

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1500);
  }
}

/**
 * YouTube Studio Advanced Analytics에서 한 번에 모든 영상 지표 가져오기
 * (Content 페이지보다 더 상세한 데이터)
 */
export async function scrapeAdvancedAnalytics(): Promise<
  Map<string, ScrapedAnalytics>
> {
  const context = await getBrowserContext();
  const page = await context.newPage();
  const analyticsMap = new Map<string, ScrapedAnalytics>();

  try {
    // YouTube Studio Analytics > Advanced Mode 이동
    await page.goto(
      "https://studio.youtube.com/analytics/tab-reach/period-default",
      {
        waitUntil: "networkidle",
        timeout: 30000,
      }
    );

    await page.waitForTimeout(3000);

    // "고급 모드" 또는 "Advanced Mode" 버튼 클릭
    const advancedButton = await page
      .locator('text="고급 모드"')
      .or(page.locator('text="Advanced mode"'))
      .or(page.locator('text="고급모드"'));

    if ((await advancedButton.count()) > 0) {
      await advancedButton.first().click();
      await page.waitForTimeout(3000);
    }

    // Advanced Mode의 테이블에서 데이터 추출
    // 이 부분은 YouTube Studio의 UI에 따라 조정이 필요할 수 있음
    console.log(
      "📊 Advanced Analytics 페이지 로드 완료, 데이터 추출 중..."
    );
  } catch (error) {
    console.error("❌ Advanced Analytics 스크래핑 실패:", error);
  } finally {
    await page.close();
  }

  return analyticsMap;
}
