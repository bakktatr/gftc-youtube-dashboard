import { chromium, type BrowserContext } from "playwright";
import path from "path";
import os from "os";

// ERP 전용 브라우저 프로필 (YouTube Studio와 분리)
const ERP_USER_DATA_DIR = path.join(
  os.homedir(),
  ".youtube-dashboard",
  "erp-browser-profile"
);

let erpBrowserContext: BrowserContext | null = null;

/**
 * ERP 전용 영구 브라우저 컨텍스트를 가져오거나 생성
 */
export async function getErpBrowserContext(): Promise<BrowserContext> {
  if (erpBrowserContext) {
    return erpBrowserContext;
  }

  erpBrowserContext = await chromium.launchPersistentContext(ERP_USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  return erpBrowserContext;
}

/**
 * ERP 브라우저 컨텍스트 닫기
 */
export async function closeErpBrowser(): Promise<void> {
  if (erpBrowserContext) {
    await erpBrowserContext.close();
    erpBrowserContext = null;
  }
}

/**
 * Django Admin 로그인 상태 확인
 */
export async function checkErpLoginStatus(): Promise<boolean> {
  const context = await getErpBrowserContext();
  const page = await context.newPage();

  try {
    await page.goto("https://link-sell.com/admin/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const url = page.url();
    // 로그인 페이지로 리다이렉트되면 미로그인 상태
    const isLoggedIn =
      url.includes("/admin/") && !url.includes("/admin/login");

    return isLoggedIn;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

/**
 * Django Admin 로그인 페이지 열기 (사용자가 수동으로 로그인)
 * 로그인이 완료될 때까지 대기 (최대 5분)
 */
export async function openErpLoginPage(): Promise<boolean> {
  const context = await getErpBrowserContext();
  const page = await context.newPage();

  try {
    await page.goto("https://link-sell.com/admin/login/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // 이미 로그인되어 있는지 확인
    if (
      page.url().includes("/admin/") &&
      !page.url().includes("/admin/login")
    ) {
      await page.close();
      return true;
    }

    console.log(
      "🔐 Django Admin 로그인이 필요합니다. 브라우저에서 로그인해주세요..."
    );

    // 로그인 완료를 기다림 (최대 5분)
    await page.waitForURL(
      (url) =>
        url.href.includes("/admin/") && !url.href.includes("/admin/login"),
      { timeout: 300000 }
    );

    console.log("✅ Django Admin 로그인 성공!");
    await page.close();
    return true;
  } catch (error) {
    console.error("❌ Django Admin 로그인 실패 또는 시간 초과:", error);
    await page.close();
    return false;
  }
}
