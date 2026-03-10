import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import contentData from "./content-data.json";
import combinedAnalytics from "./analytics-combined.json";
import viewsData from "./views-data.json";
import retentionData from "./retention-data.json";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// Parse duration string "MM:SS" or "H:MM:SS" to seconds
function parseDuration(dur: string): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Parse date string "2026. 3. 5" to Date object
function parseDate(dateStr: string): Date {
  const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!match) return new Date();
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
}

// Normalize title for fuzzy matching
function normalizeTitle(title: string): string {
  return title
    .replace(/[''""\"\']/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.\.\./g, "")
    .replace(/\.$/g, "")
    .trim()
    .toLowerCase();
}

async function main() {
  console.log("Starting video seed...");
  console.log(`Content videos: ${contentData.length}`);

  // Combined analytics format: [title, views, watchTimeHrs, subs, impressions, ctr]
  type AnalyticsRecord = { title: string; views: number; watchTimeHrs: number; subs: number; impressions: number; ctr: number };
  const analyticsMap = new Map<string, AnalyticsRecord>();
  for (const row of combinedAnalytics) {
    const [title, views, watchTimeHrs, subs, impressions, ctr] = row as [string, number, number, number, number, number];
    const rec: AnalyticsRecord = { title, views, watchTimeHrs, subs, impressions, ctr };
    analyticsMap.set(normalizeTitle(title), rec);
  }
  console.log(`Combined analytics records: ${analyticsMap.size}`);

  let matched = 0;
  let unmatched = 0;

  for (const video of contentData) {
    const normalizedTitle = normalizeTitle(video.title);

    // Try exact normalized match first
    let analytics: AnalyticsRecord | undefined = analyticsMap.get(normalizedTitle);

    // If no exact match, try prefix matching (first 15 chars)
    if (!analytics) {
      const prefix = normalizedTitle.substring(0, 15);
      for (const [key, value] of analyticsMap) {
        if (key.startsWith(prefix) || normalizedTitle.startsWith(key.substring(0, 15))) {
          analytics = value;
          break;
        }
      }
    }

    const durationSec = parseDuration(video.duration);
    const publishedAt = parseDate(video.date);
    // Use content page views (total lifetime) as primary, fallback to analytics period views
    const contentViews = (viewsData as Record<string, number>)[video.videoId] ?? 0;
    const views = contentViews || (analytics?.views ?? 0);
    const subscribersGained = analytics?.subs ?? 0;
    const ctr = analytics?.ctr ?? 0;
    const avgViewDurationSec =
      analytics && analytics.views > 0
        ? Math.round((analytics.watchTimeHrs * 3600) / analytics.views)
        : 0;

    const retention30s = (retentionData as Record<string, number>)[video.videoId] ?? null;

    if (analytics) matched++;
    else unmatched++;

    await prisma.video.upsert({
      where: { videoId: video.videoId },
      create: {
        videoId: video.videoId,
        title: video.title,
        publishedAt,
        duration: durationSec,
        views,
        subscribersGained,
        subscribersLost: 0,
        averageViewDuration: avgViewDurationSec,
        ctr,
        retention30s,
        lastSyncAt: new Date(),
      },
      update: {
        title: video.title,
        publishedAt,
        duration: durationSec,
        views,
        subscribersGained,
        averageViewDuration: avgViewDurationSec,
        ctr,
        retention30s,
        lastSyncAt: new Date(),
      },
    });
  }

  // Update settings with channel info and last sync
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      channelId: "UCxQdHAim3q0qzfo3yKojZ8w",
      channelName: "글로벌트레이더협회",
      lastSyncAt: new Date(),
    },
    update: {
      channelId: "UCxQdHAim3q0qzfo3yKojZ8w",
      channelName: "글로벌트레이더협회",
      lastSyncAt: new Date(),
    },
  });

  // Create sync log
  await prisma.syncLog.create({
    data: {
      status: "success",
      videoCount: contentData.length,
      duration: 0,
    },
  });

  console.log(`\nDone! Inserted ${contentData.length} videos.`);
  console.log(`  Matched with analytics: ${matched}`);
  console.log(`  No analytics data: ${unmatched}`);
  console.log(`  With retention data: ${Object.keys(retentionData).length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
