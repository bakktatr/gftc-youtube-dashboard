import { chromium, type Browser, type BrowserContext } from "playwright";
import path from "path";
import os from "os";

// 브라우저 프로필 저장 경로 (로그인 세션 유지)
const USER_DATA_DIR = path.join(os.homedir(), ".youtube-dashboard", "browser-profile");

let browserContext: BrowserContext | null = null;

/**
 * 영구 브라우저 컨텍스트를 가져오거나 생성
 * - 첫 실행 시: 브라우저가 열리고 사용자가 YouTube Studio에 로그인
 * - 이후 실행: 저장된 쿠키/세션으로 자동 로그인 유지
 */
export async function getBrowserContext(): Promise<BrowserContext> {
  if (browserContext) {
    return browserContext;
  }

  browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, // YouTube 로그인을 위해 브라우저를 보여줌
    viewport: { width: 1280, height: 900 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    args: [
      "--disable-blink-features=AutomationControlled", // 자동화 감지 방지
    ],
  });

  return browserContext;
}

/**
 * 브라우저 컨텍스트 닫기
 */
export async function closeBrowser(): Promise<void> {
  if (browserContext) {
    await browserContext.close();
    browserContext = null;
  }
}

/**
 * YouTube Studio 로그인 상태 확인
 * @returns 로그인 되어있으면 true
 */
export async function checkLoginStatus(): Promise<boolean> {
  const context = await getBrowserContext();
  const page = await context.newPage();

  try {
    await page.goto("https://studio.youtube.com", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 로그인 페이지로 리다이렉트되면 미로그인 상태
    const url = page.url();
    const isLoggedIn =
      url.includes("studio.youtube.com") &&
      !url.includes("accounts.google.com");

    return isLoggedIn;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

/**
 * YouTube Studio 로그인 페이지 열기 (사용자가 수동으로 로그인)
 * 로그인이 완료될 때까지 대기
 */
export async function openLoginPage(): Promise<boolean> {
  const context = await getBrowserContext();
  const page = await context.newPage();

  try {
    await page.goto("https://studio.youtube.com", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // 이미 로그인되어 있는지 확인
    if (
      page.url().includes("studio.youtube.com") &&
      !page.url().includes("accounts.google.com")
    ) {
      await page.close();
      return true;
    }

    // 로그인 완료를 기다림 (최대 5분)
    console.log("🔐 YouTube Studio 로그인이 필요합니다. 브라우저에서 로그인해주세요...");
    await page.waitForURL("**/studio.youtube.com/**", {
      timeout: 300000, // 5분
    });

    console.log("✅ 로그인 성공!");
    await page.close();
    return true;
  } catch (error) {
    console.error("❌ 로그인 실패 또는 시간 초과:", error);
    await page.close();
    return false;
  }
}
