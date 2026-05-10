"use server";

import { chromium, type Browser, type Page } from "playwright";

export interface ScrapedLead {
  companyName: string;
  website: string | null;
  phone: string | null;
}

const MAX_RESULTS = 7;
const NAVIGATION_TIMEOUT = 45000;
const RESULTS_TIMEOUT = 30000;

/**
 * Handle Google's consent / cookie page.
 * Google Maps frequently redirects to `consent.google.com` before showing
 * the actual map. Without dismissing it we never see `#searchboxinput`,
 * which is the root cause of the "input#searchboxinput visible" timeout.
 */
async function handleConsent(page: Page): Promise<void> {
  const consentSelectors = [
    'button:has-text("Accept all")',
    'button:has-text("Reject all")',
    'button:has-text("Zaakceptuj wszystko")',
    'button:has-text("Odrzuć wszystko")',
    'button:has-text("Zgadzam się")',
    'button:has-text("Прийняти все")',
    'button:has-text("Відхилити все")',
    'button[aria-label*="Accept"]',
    'button[aria-label*="Reject"]',
    'form[action*="consent"] button',
  ];

  for (const selector of consentSelectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click({ timeout: 5000 }).catch(() => {});
        // Consent submission usually triggers a navigation back to maps.
        await page
          .waitForLoadState("domcontentloaded", { timeout: 15000 })
          .catch(() => {});
        await page.waitForTimeout(1500);
        return;
      }
    } catch {
      // try next selector
    }
  }
}

export async function scrapeGoogleMaps(
  query: string,
  city: string
): Promise<ScrapedLead[]> {
  const fullQuery = `${query} ${city}`.trim();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: false,
      args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "en-US",
      viewport: { width: 1366, height: 900 },
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    page.setDefaultTimeout(15000);

    // Direct search URL — bypasses the searchbox interaction entirely.
    // `hl=en` forces the English UI, which keeps our selectors stable.
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(
      fullQuery
    )}?hl=en`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // If Google redirected us to the consent screen, dismiss it. After
    // accepting/rejecting, Google sends us back to the original maps URL.
    if (/consent\.google\.|\/consent/i.test(page.url())) {
      await handleConsent(page);
      // Re-navigate explicitly in case consent didn't auto-redirect.
      if (!/google\.[^/]+\/maps/.test(page.url())) {
        await page
          .goto(searchUrl, { waitUntil: "domcontentloaded" })
          .catch(() => {});
      }
    } else {
      // Inline consent banner (no redirect) — try to dismiss too.
      await handleConsent(page);
    }

    // Wait for search results. Google Maps may render either a feed of
    // result cards or, for a single match, jump straight into the place
    // detail panel. We accept either signal.
    const resultsAppeared = await Promise.race([
      page
        .locator('a[href*="/maps/place/"]')
        .first()
        .waitFor({ state: "attached", timeout: RESULTS_TIMEOUT })
        .then(() => "list" as const)
        .catch(() => null),
      page
        .locator('div[role="feed"]')
        .first()
        .waitFor({ state: "visible", timeout: RESULTS_TIMEOUT })
        .then(() => "feed" as const)
        .catch(() => null),
      page
        .locator("h1.DUwDvf, h1.fontHeadlineLarge")
        .first()
        .waitFor({ state: "visible", timeout: RESULTS_TIMEOUT })
        .then(() => "single" as const)
        .catch(() => null),
    ]);

    if (!resultsAppeared) {
      throw new Error(
        `No results rendered for "${fullQuery}". Google may be blocking or the query is too narrow.`
      );
    }

    await page.waitForTimeout(1500);

    // Single-result case: Google jumped directly into a place detail.
    if (resultsAppeared === "single") {
      const lead = await extractFromDetailPanel(page);
      return lead ? [lead] : [];
    }

    // List case: collect place links
    const placeLinks = await page.locator('a[href*="/maps/place/"]').all();
    const count = Math.min(placeLinks.length, MAX_RESULTS);
    const leads: ScrapedLead[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const link = placeLinks[i];

        let companyName = await link.getAttribute("aria-label");
        if (companyName && companyName.includes("·")) {
          companyName = companyName.split("·")[0].trim();
        }
        if (!companyName || companyName === "Results") {
          companyName = await link.innerText().catch(() => null);
        }

        if (!companyName?.trim()) {
          continue;
        }

        await link.click();
        await page.waitForTimeout(1500);

        try {
          await page
            .locator("h1.DUwDvf, h1.fontHeadlineLarge, h1")
            .first()
            .waitFor({ state: "visible", timeout: 8000 });
        } catch {
          // panel may not have fully rendered — continue with best effort
        }
        await page.waitForTimeout(500);

        const detail = await extractFromDetailPanel(page, companyName.trim());
        if (detail) leads.push(detail);

        const backButton = page
          .locator('button[aria-label*="Back"], button[jsaction*="back"]')
          .first();
        if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await backButton.click();
          await page.waitForTimeout(1500);
        }
      } catch (itemError) {
        console.error(`Error scraping item ${i}:`, itemError);
        continue;
      }
    }

    return leads;
  } catch (error) {
    console.error("Google Maps scraper error:", error);
    throw new Error(
      `Failed to scrape Google Maps: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function extractFromDetailPanel(
  page: Page,
  fallbackName?: string
): Promise<ScrapedLead | null> {
  let companyName = fallbackName ?? null;
  try {
    const heading = await page
      .locator("h1.DUwDvf, h1.fontHeadlineLarge, h1")
      .first()
      .innerText({ timeout: 3000 });
    if (heading?.trim()) companyName = heading.trim();
  } catch {
    // keep fallback
  }

  if (!companyName) return null;

  let phone: string | null = null;
  try {
    const phoneBtn = page
      .locator(
        'button[data-tooltip*="phone"], button[data-item-id*="phone:"], a[href^="tel:"]'
      )
      .first();
    if (await phoneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const phoneHref = await phoneBtn.getAttribute("href").catch(() => null);
      if (phoneHref?.startsWith("tel:")) {
        phone = phoneHref.replace("tel:", "").trim();
      } else {
        const aria = await phoneBtn.getAttribute("aria-label").catch(() => null);
        phone = aria?.replace(/^Phone:?\s*/i, "").trim() ?? null;
        if (!phone) {
          phone = (await phoneBtn.textContent())?.trim() ?? null;
        }
      }
    }
  } catch {
    phone = null;
  }

  let website: string | null = null;
  try {
    const websiteLink = page
      .locator('a[data-tooltip*="website"], a[data-item-id*="authority"]')
      .first();
    if (await websiteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      website = (await websiteLink.getAttribute("href")) ?? null;
    }
  } catch {
    website = null;
  }

  return { companyName, website, phone };
}
