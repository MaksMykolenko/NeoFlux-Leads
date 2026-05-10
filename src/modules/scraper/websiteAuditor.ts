"use server";

import { chromium, type Browser } from "playwright";

export interface AuditResult {
  ssl: boolean;
  mobileFriendly: boolean;
  seoOptimized: boolean;
  email: string | null;
  issues: string[];
}

const SLOW_THRESHOLD_MS = 3000;
const PENALTY_PER_ISSUE = 20;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Patterns that indicate a regex hit that ISN'T a real contact email.
// Covers asset filenames accidentally matching `name@2x.png`, plus the most
// common third-party / placeholder addresses we see in the wild.
const FAKE_EMAIL_PATTERNS: RegExp[] = [
  /\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|eot|mp4|webm)$/i,
  /sentry/i,
  /wix(?:press)?/i,
  /example\.(?:com|org|net)/i,
  /@\dx\./i,
];

function extractEmailFromHtml(html: string): string | null {
  const matches = html.match(EMAIL_REGEX);
  if (!matches) return null;

  const seen = new Set<string>();
  for (const candidate of matches) {
    const lower = candidate.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    if (FAKE_EMAIL_PATTERNS.some((re) => re.test(lower))) continue;

    return candidate;
  }
  return null;
}

export async function analyzeWebsite(url: string): Promise<AuditResult> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    const issues: string[] = [];

    const startTime = Date.now();
    let finalUrl: string;
    let html = "";

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      finalUrl = page.url();
      html = await page.content().catch(() => "");
    } catch {
      return {
        ssl: false,
        mobileFriendly: false,
        seoOptimized: false,
        email: null,
        issues: ["Сайт недоступний або не завантажується"],
      };
    }

    const loadTimeMs = Date.now() - startTime;

    const ssl = finalUrl.startsWith("https://");
    if (!ssl) {
      issues.push("Відсутній SSL сертифікат");
    }

    const viewportContent = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content")
      .catch(() => null);
    const mobileFriendly =
      viewportContent !== null && viewportContent.includes("width=device-width");
    if (!mobileFriendly) {
      issues.push("Сайт не адаптований для мобільних");
    }

    const h1Count = await page.locator("h1").count();
    const hasH1 = h1Count > 0;
    if (!hasH1) {
      issues.push("Відсутній тег <h1>");
    }

    const titleText = await page.title();
    const hasTitle = !!titleText?.trim();
    if (!hasTitle) {
      issues.push("Відсутній тег <title>");
    }

    const seoOptimized = hasH1 && hasTitle;

    if (loadTimeMs > SLOW_THRESHOLD_MS) {
      issues.push(`Повільне завантаження (${loadTimeMs}мс)`);
    }

    const email = extractEmailFromHtml(html);

    await browser.close();

    return {
      ssl,
      mobileFriendly,
      seoOptimized,
      email,
      issues,
    };
  } catch (error) {
    console.error("Website auditor error:", error);
    return {
      ssl: false,
      mobileFriendly: false,
      seoOptimized: false,
      email: null,
      issues: [
        `Помилка аналізу: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function calculatePerformanceScore(issues: string[]): Promise<number> {
  return Math.max(0, 100 - issues.length * PENALTY_PER_ISSUE);
}
