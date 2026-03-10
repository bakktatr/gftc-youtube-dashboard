/**
 * 랜딩페이지 스크린샷 캡처 유틸리티
 * 원본: meta-ad-automation/modules/concept_generator.py capture_url_screenshot()
 */

import { chromium } from "playwright";
import sharp from "sharp";

/** 최대 이미지 크기 (장축 기준, Claude Vision 최적) */
const MAX_LONG_SIDE = 1568;
/** JPEG 품질 */
const JPEG_QUALITY = 85;

/**
 * URL의 풀페이지 스크린샷을 JPEG Buffer로 반환합니다.
 * - Viewport: 1440×900
 * - fullPage screenshot
 * - 장축 1568px 리사이즈 + JPEG 85%
 */
export async function captureScreenshot(url: string): Promise<Buffer> {
  // 프로토콜 없으면 https:// 자동 추가
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // 추가 대기 (동적 콘텐츠 로딩)
    await page.waitForTimeout(2000);

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "jpeg",
      quality: JPEG_QUALITY,
    });

    return await resizeForClaude(Buffer.from(screenshotBuffer));
  } finally {
    await browser.close();
  }
}

/**
 * 이미지 Buffer를 Claude Vision에 최적화된 크기로 리사이즈합니다.
 * 장축 1568px, JPEG 85%
 */
async function resizeForClaude(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const { width = 0, height = 0 } = metadata;
  const longSide = Math.max(width, height);

  if (longSide <= MAX_LONG_SIDE) {
    // 이미 충분히 작으면 JPEG 변환만
    return sharp(imageBuffer).jpeg({ quality: JPEG_QUALITY }).toBuffer();
  }

  // 장축 기준 비율 리사이즈
  const scale = MAX_LONG_SIDE / longSide;
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  return sharp(imageBuffer)
    .resize(newWidth, newHeight)
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

/**
 * 이미지 Buffer를 Claude Vision API에 사용할 base64 문자열로 변환합니다.
 */
export function prepareImageForClaude(imageBuffer: Buffer): string {
  return imageBuffer.toString("base64");
}

/**
 * base64 인코딩된 이미지를 Claude Vision에 최적화된 크기로 변환합니다.
 */
export async function prepareBase64ImageForClaude(
  base64: string
): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const resized = await resizeForClaude(buffer);
  return resized.toString("base64");
}
