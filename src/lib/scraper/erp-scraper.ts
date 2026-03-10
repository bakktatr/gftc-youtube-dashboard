import { getErpBrowserContext } from "./erp-browser";

export interface CampaignLeadCount {
  campaign: string; // e.g. "26.03.05_볼린저"
  count: number;
}

interface LeadRow {
  email: string;
  utmSource: string;
  utmCampaign: string;
}

/**
 * Django admin 리드 테이블을 모든 페이지에 걸쳐 스크래핑
 * YouTube UTM 소스만 필터하고, 이메일 기준 중복 제거
 */
async function scrapeLeadTable(
  adminPath: string,
  emailIndex: number,
  utmSourceIndex: number,
  utmCampaignIndex: number
): Promise<LeadRow[]> {
  const context = await getErpBrowserContext();
  const page = await context.newPage();
  const allRows: LeadRow[] = [];

  try {
    let pageNum = 0;
    let hasNextPage = true;

    while (hasNextPage) {
      const url = `https://link-sell.com${adminPath}?p=${pageNum}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      // 테이블 행 추출
      const rows = await page.evaluate(
        ({ emailIdx, srcIdx, campIdx }) => {
          const results: LeadRow[] = [];
          const tableRows = document.querySelectorAll(
            "#result_list tbody tr"
          );

          tableRows.forEach((tr) => {
            const cells = tr.querySelectorAll("td, th");
            const email = cells[emailIdx]?.textContent?.trim() || "";
            const utmSource = cells[srcIdx]?.textContent?.trim() || "";
            const utmCampaign = cells[campIdx]?.textContent?.trim() || "";
            results.push({ email, utmSource, utmCampaign });
          });

          return results;
        },
        {
          emailIdx: emailIndex,
          srcIdx: utmSourceIndex,
          campIdx: utmCampaignIndex,
        }
      );

      if (rows.length === 0) {
        hasNextPage = false;
        break;
      }

      allRows.push(...rows);

      // 다음 페이지 링크 존재 여부 확인
      hasNextPage = await page.evaluate(() => {
        const paginator = document.querySelector(".paginator");
        if (!paginator) return false;
        // Django admin의 "다음" 버튼 또는 next 링크 확인
        const links = paginator.querySelectorAll("a");
        for (const link of links) {
          if (
            link.textContent?.includes("다음") ||
            link.classList.contains("next")
          ) {
            return true;
          }
        }
        return false;
      });

      pageNum++;
      // Rate limiting
      await page.waitForTimeout(500);
    }
  } finally {
    await page.close();
  }

  return allRows;
}

/**
 * V1 + V2 리드 테이블을 스크래핑하고, YouTube UTM 필터 + 이메일 중복 제거 후
 * 캠페인별 리드 수를 집계하여 반환
 */
export async function scrapeErpLeads(): Promise<CampaignLeadCount[]> {
  console.log("📋 V1 리드 테이블 스크래핑...");
  const v1Rows = await scrapeLeadTable(
    "/admin/home/landingleadv1/",
    2, // 이메일 column index
    8, // UTM 소스 column index
    9 // UTM 캠페인 column index
  );
  console.log(`  V1: ${v1Rows.length}개 행 수집`);

  console.log("📋 V2 리드 테이블 스크래핑...");
  const v2Rows = await scrapeLeadTable(
    "/admin/home/landingleadv2/",
    2, // 이메일 column index
    12, // UTM 소스 column index
    13 // UTM 캠페인 column index
  );
  console.log(`  V2: ${v2Rows.length}개 행 수집`);

  // V1 + V2 합치기
  const allRows = [...v1Rows, ...v2Rows];

  // YouTube UTM 소스만 필터
  const youtubeRows = allRows.filter((row) =>
    row.utmSource.toLowerCase().includes("youtube")
  );
  console.log(`  YouTube UTM 필터 후: ${youtubeRows.length}개`);

  // 이메일 + 캠페인 조합 기준 중복 제거
  const seen = new Set<string>();
  const dedupedRows: LeadRow[] = [];

  for (const row of youtubeRows) {
    if (!row.utmCampaign || !row.email) continue;
    const key = `${row.email.toLowerCase()}|${row.utmCampaign}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedRows.push(row);
    }
  }
  console.log(`  이메일 중복 제거 후: ${dedupedRows.length}개`);

  // 캠페인별 리드 수 집계
  const campaignMap = new Map<string, number>();
  for (const row of dedupedRows) {
    campaignMap.set(
      row.utmCampaign,
      (campaignMap.get(row.utmCampaign) || 0) + 1
    );
  }

  const result = Array.from(campaignMap.entries()).map(
    ([campaign, count]) => ({
      campaign,
      count,
    })
  );

  console.log(`  캠페인 수: ${result.length}개`);
  return result;
}
