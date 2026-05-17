"use server";

import { chromium, type Browser } from "playwright";
import { validateExternalUrl } from "@/src/lib/security/urlSafety";

export interface AuditResult {
  ssl: boolean;
  mobileFriendly: boolean;
  seoOptimized: boolean;
  email: string | null;
  phone: string | null;
  issues: string[];
}

class UnsafeUrlError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const SLOW_THRESHOLD_MS = 3000;
const PENALTY_PER_ISSUE = 20;
const MAX_MAIN_NAVIGATION_REQUESTS = 8;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?:\+?\d[\s().-]?){7,}\d/g;
const CONTACT_HREF_REGEX =
  /(contact|kontakt|contacts|kontaktai|contato|impressum)/i;
const CTA_TEXT_REGEX =
  /\b(contact|book|call|quote|reserve|appointment|consultation|start|buy|order|get in touch|kontakt|umow|rezerw|zadzwo)\b/i;
const SOCIAL_HREF_REGEX =
  /(facebook\.com|instagram\.com|linkedin\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com)/i;

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

function extractPhoneFromText(text: string): string | null {
  const matches = text.match(PHONE_REGEX);
  if (!matches) return null;

  for (const candidate of matches) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 16) {
      return candidate.trim().slice(0, 64);
    }
  }
  return null;
}

function findOutdatedCopyrightYear(text: string): number | null {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    text.matchAll(/(?:copyright|©)\s*(?:\D{0,20})?((?:19|20)\d{2})/gi),
  )
    .map((match) => Number(match[1]))
    .filter((year) => Number.isFinite(year));
  const oldestRecent = Math.max(...years, 0);
  if (oldestRecent > 0 && oldestRecent < currentYear - 1) {
    return oldestRecent;
  }
  return null;
}

export async function analyzeWebsite(url: string): Promise<AuditResult> {
  // SSRF guard: reject non-http(s), userinfo URLs, and any host that resolves
  // to a loopback / private / link-local / cloud-metadata IP. Without this,
  // Playwright would happily fetch `http://169.254.169.254/latest/meta-data`
  // or `http://localhost:5432` from inside our serverless function.
  const safety = await validateExternalUrl(url);
  if (!safety.ok) {
    throw new UnsafeUrlError(safety.reason, safety.message);
  }
  const startUrl = safety.normalizedUrl;

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
    const safetyCache = new Map<string, ReturnType<typeof validateExternalUrl>>();
    let blockedNavigationMessage: string | null = null;
    let blockedSubresourceCount = 0;
    let mainNavigationRequests = 0;

    const checkUrl = (targetUrl: string) => {
      const cached = safetyCache.get(targetUrl);
      if (cached) return cached;
      const check = validateExternalUrl(targetUrl);
      safetyCache.set(targetUrl, check);
      return check;
    };

    await context.route("**/*", async (route) => {
      const request = route.request();
      const requestUrl = request.url();
      const isMainNavigation =
        request.isNavigationRequest() && request.frame() === page.mainFrame();

      if (isMainNavigation) {
        mainNavigationRequests += 1;
        if (mainNavigationRequests > MAX_MAIN_NAVIGATION_REQUESTS) {
          blockedNavigationMessage = "Забагато redirect-ів під час аудиту сайту.";
          await route.abort("blockedbyclient");
          return;
        }
      }

      const requestSafety = await checkUrl(requestUrl);
      if (!requestSafety.ok) {
        if (isMainNavigation) {
          blockedNavigationMessage = requestSafety.message;
        } else {
          blockedSubresourceCount += 1;
        }
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
    });

    const startTime = Date.now();
    let finalUrl: string;
    let html = "";

    try {
      await page.goto(startUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      finalUrl = page.url();
      const finalSafety = await validateExternalUrl(finalUrl);
      if (!finalSafety.ok) {
        throw new UnsafeUrlError(finalSafety.reason, finalSafety.message);
      }
      html = await page.content().catch(() => "");
    } catch (err) {
      if (err instanceof UnsafeUrlError) {
        throw err;
      }
      if (blockedNavigationMessage) {
        throw new UnsafeUrlError("PRIVATE_IP", blockedNavigationMessage);
      }
      return {
        ssl: false,
        mobileFriendly: false,
        seoOptimized: false,
        email: null,
        phone: null,
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
    } else if (titleText.trim().length < 20) {
      issues.push("Слабкий SEO title");
    }

    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => null);
    if (!metaDescription?.trim()) {
      issues.push("Відсутній meta description");
    }

    const seoOptimized = hasH1 && hasTitle && !!metaDescription?.trim();

    if (loadTimeMs > SLOW_THRESHOLD_MS) {
      issues.push(`Повільне завантаження (${loadTimeMs}мс)`);
    }

    const email = extractEmailFromHtml(html);
    if (!email) {
      issues.push("Контактний email не знайдено");
    }

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const phone = extractPhoneFromText(bodyText);
    if (!phone) {
      issues.push("Телефон не знайдено");
    }

    const anchors = await page
      .locator("a")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          href: node.getAttribute("href") ?? "",
          text: node.textContent ?? "",
        })),
      )
      .catch(() => []);
    const hasContactPage = anchors.some(
      (anchor) =>
        CONTACT_HREF_REGEX.test(anchor.href) ||
        CONTACT_HREF_REGEX.test(anchor.text),
    );
    if (!hasContactPage) {
      issues.push("Сторінку контактів не знайдено");
    }

    const ctaTexts = await page
      .locator("a,button")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.textContent?.trim() ?? "").filter(Boolean),
      )
      .catch(() => []);
    const hasClearCta = ctaTexts.some((text) => CTA_TEXT_REGEX.test(text));
    if (!hasClearCta) {
      issues.push("Немає чіткого CTA");
    }

    const hasSocialLinks = anchors.some((anchor) =>
      SOCIAL_HREF_REGEX.test(anchor.href),
    );
    if (!hasSocialLinks) {
      issues.push("Соцпосилання не знайдено");
    }

    const outdatedYear = findOutdatedCopyrightYear(bodyText);
    if (outdatedYear) {
      issues.push(`Застарілий copyright (${outdatedYear})`);
    }
    if (blockedSubresourceCount > 0) {
      issues.push(
        `Заблоковано небезпечні внутрішні ресурси (${blockedSubresourceCount})`,
      );
    }

    await browser.close();
    browser = null;

    return {
      ssl,
      mobileFriendly,
      seoOptimized,
      email,
      phone,
      issues,
    };
  } catch (error) {
    console.error("Website auditor error:", error);
    return {
      ssl: false,
      mobileFriendly: false,
      seoOptimized: false,
      email: null,
      phone: null,
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
