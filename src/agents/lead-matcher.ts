import { prisma } from "@/lib/prisma";
import type { CampaignLeadCount } from "@/lib/scraper/erp-scraper";

interface MatchResult {
  videoId: string;
  campaign: string;
  leads: number;
  matchType: "date-only" | "keyword" | "distributed";
}

interface UnmatchedCampaign {
  campaign: string;
  count: number;
  reason: string;
}

export interface LeadMatcherResult {
  success: boolean;
  matched: MatchResult[];
  unmatched: UnmatchedCampaign[];
  videosUpdated: number;
  totalLeadsMatched: number;
  totalLeadsUnmatched: number;
  errors: string[];
}

// 캠페인 키워드 → 영상 제목 키워드 매칭 패턴
const KEYWORD_PATTERNS: [string, string][] = [
  ["비트", "비트코인"],
  ["나스닥", "나스닥"],
  ["골드", "금"],
  ["금 ", "금"],
  ["볼린저", "볼린저"],
  ["매매기법", "매매"],
  ["이격도", "이격"],
  ["추세매매", "추세"],
  ["이동평균", "이동평균"],
  ["코스피", "코스피"],
  ["부업", "부업"],
  ["거래소", "거래소"],
  ["두바이", "두바이"],
  ["캔들", "캔들"],
  ["거래량", "거래량"],
  ["리메이크", "매매법"],
  ["시황", "시황"],
  ["실력", "수익"],
  ["인사이트", "투자"],
  ["팟캐스트", "팟캐스트"],
  ["OB", "오더블럭"],
  ["심법", "심법"],
  ["리틀리", "리틀리"],
  ["세미나", "세미나"],
];

/**
 * publishedAt (UTC) → KST 날짜 문자열 (YYYY-MM-DD)
 */
function toKSTDate(date: Date): string {
  const d = new Date(date);
  d.setHours(d.getHours() + 9);
  return d.toISOString().split("T")[0];
}

/**
 * 캠페인 날짜 (YY.MM.DD) → YYYY-MM-DD
 */
function campaignToDate(campaign: string): string | null {
  const match = campaign.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return `20${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * 캠페인 키워드가 영상 제목과 매칭되는지 확인
 */
function keywordMatch(keyword: string, title: string): boolean {
  const kw = keyword.toLowerCase();
  const t = title.toLowerCase();

  for (const [kwPat, titlePat] of KEYWORD_PATTERNS) {
    if (
      kw.includes(kwPat.toLowerCase()) &&
      t.includes(titlePat.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 캠페인 리드 데이터를 영상에 매칭하고 DB의 leadCount를 업데이트
 * 전체 리셋 후 재할당 (full re-sync)
 */
export async function matchLeadsToVideos(
  campaigns: CampaignLeadCount[]
): Promise<LeadMatcherResult> {
  const result: LeadMatcherResult = {
    success: false,
    matched: [],
    unmatched: [],
    videosUpdated: 0,
    totalLeadsMatched: 0,
    totalLeadsUnmatched: 0,
    errors: [],
  };

  try {
    // DB에서 모든 영상 조회
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        videoId: true,
        title: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    // 날짜별 영상 맵 구축
    const dateToVideos = new Map<
      string,
      { id: string; videoId: string; title: string; publishedAt: Date }[]
    >();
    for (const v of videos) {
      const kstDate = toKSTDate(v.publishedAt);
      const existing = dateToVideos.get(kstDate) || [];
      existing.push(v);
      dateToVideos.set(kstDate, existing);
    }

    // 영상별 리드 수 집계
    const videoLeadMap = new Map<string, number>();

    for (const { campaign, count } of campaigns) {
      const campDate = campaignToDate(campaign);
      if (!campDate) {
        result.unmatched.push({
          campaign,
          count,
          reason: "날짜 파싱 실패",
        });
        continue;
      }

      const keyword = campaign.replace(/^\d{2}\.\d{2}\.\d{2}_/, "");
      const videosOnDate = dateToVideos.get(campDate) || [];

      if (videosOnDate.length === 0) {
        result.unmatched.push({
          campaign,
          count,
          reason: `${campDate} 날짜에 영상 없음`,
        });
        continue;
      }

      if (videosOnDate.length === 1) {
        // 해당 날짜에 영상 1개 → 직접 매칭
        const vid = videosOnDate[0];
        videoLeadMap.set(
          vid.videoId,
          (videoLeadMap.get(vid.videoId) || 0) + count
        );
        result.matched.push({
          videoId: vid.videoId,
          campaign,
          leads: count,
          matchType: "date-only",
        });
        continue;
      }

      // 같은 날짜에 여러 영상 → 키워드 매칭 시도
      const matched = videosOnDate.find((v) => keywordMatch(keyword, v.title));
      if (matched) {
        videoLeadMap.set(
          matched.videoId,
          (videoLeadMap.get(matched.videoId) || 0) + count
        );
        result.matched.push({
          videoId: matched.videoId,
          campaign,
          leads: count,
          matchType: "keyword",
        });
      } else {
        // 키워드 매칭 실패 → 균등 분배
        const perVideo = Math.ceil(count / videosOnDate.length);
        for (const v of videosOnDate) {
          videoLeadMap.set(
            v.videoId,
            (videoLeadMap.get(v.videoId) || 0) + perVideo
          );
        }
        result.unmatched.push({
          campaign,
          count,
          reason: `${campDate}에 ${videosOnDate.length}개 영상, 키워드 매칭 실패 → 균등 분배`,
        });
      }
    }

    // Step 1: 전체 leadCount 리셋
    await prisma.video.updateMany({
      data: { leadCount: 0 },
    });

    // Step 2: 매칭된 영상 업데이트
    for (const [videoId, leadCount] of videoLeadMap.entries()) {
      try {
        await prisma.video.update({
          where: { videoId },
          data: { leadCount },
        });
        result.videosUpdated++;
      } catch {
        // videoId가 DB에 없는 경우 무시
        result.errors.push(`영상 ${videoId} DB에 없음 (리드 ${leadCount}개)`);
      }
    }

    result.totalLeadsMatched = result.matched.reduce(
      (s, m) => s + m.leads,
      0
    );
    result.totalLeadsUnmatched = result.unmatched.reduce(
      (s, u) => s + u.count,
      0
    );
    result.success = true;

    console.log(
      `📊 매칭 결과: ${result.totalLeadsMatched}개 리드 → ${result.videosUpdated}개 영상`
    );
    console.log(`📊 미매칭: ${result.totalLeadsUnmatched}개 리드`);
  } catch (error) {
    result.errors.push(`Lead matching error: ${error}`);
  }

  return result;
}
