#!/usr/bin/env node
/**
 * scripts/check-public-links.mjs
 *
 * Fetches every public marketing URL and reports anything that isn't 200 OK
 * (after following redirects). Run against:
 *   - production:  npm run check:links
 *   - local dev:   FLUX_BASE_URL=http://localhost:3000 npm run check:links
 *
 * Also fetches sitemap.xml and robots.txt to validate they're reachable.
 *
 * Pure Node 18+: no deps, uses global fetch. Exits with code 1 on any failure.
 */

const BASE =
  process.env.FLUX_BASE_URL?.replace(/\/$/, "") || "https://flux-leads.com";

const PUBLIC_URLS = [
  // EN
  "/en",
  "/en/pricing",
  "/en/solutions/web-agencies",
  "/en/find-web-design-clients",
  "/en/lead-generation-for-web-agencies",
  "/en/local-business-website-audit-tool",
  "/en/cold-email-for-web-agencies",
  "/en/privacy",
  "/en/terms",
  "/en/cookies",
  "/en/acceptable-use",

  // UK
  "/uk",
  "/uk/pricing",
  "/uk/solutions/web-agencies",
  "/uk/yak-znajty-klientiv-na-sajty",
  "/uk/lidogeneratsiya-dlya-veb-studiy",
  "/uk/privacy",
  "/uk/terms",
  "/uk/cookies",
  "/uk/acceptable-use",

  // PL
  "/pl",
  "/pl/pricing",
  "/pl/solutions/agencje-webowe",
  "/pl/jak-znalezc-klientow-na-strony-internetowe",
  "/pl/pozyskiwanie-klientow-dla-agencji-webowych",
  "/pl/privacy",
  "/pl/terms",
  "/pl/cookies",
  "/pl/acceptable-use",
];

const INFRA_URLS = ["/sitemap.xml", "/robots.txt", "/logo-mark.svg"];

/**
 * URLs that MUST NOT exist (404 expected). The previous SEO PR could have left
 * stale alternates pointing at these — we explicitly assert they 404 so an
 * accidental future re-add is caught.
 */
const SHOULD_404 = [
  "/uk/find-web-design-clients",
  "/uk/lead-generation-for-web-agencies",
  "/pl/find-web-design-clients",
  "/pl/lead-generation-for-web-agencies",
];

const TIMEOUT_MS = 20_000;

async function check(path, { expect404 = false } = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "FluxLeadsLinkChecker/1.0" },
    });
    const ok = expect404 ? res.status === 404 : res.status >= 200 && res.status < 400;
    return {
      url,
      status: res.status,
      ok,
      expect404,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      expect404,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function fmtRow(r) {
  const tag = r.ok ? "✓" : "✗";
  const status = r.status === 0 ? "ERR" : r.status;
  const note = r.error
    ? ` — ${r.error}`
    : r.expect404
      ? " (expected 404)"
      : "";
  return `  ${tag} ${status}  ${r.url}${note}`;
}

async function main() {
  console.log(`\nFlux Leads link checker — base: ${BASE}\n`);

  const results = [];

  console.log("Public marketing pages:");
  for (const path of PUBLIC_URLS) {
    const r = await check(path);
    results.push(r);
    console.log(fmtRow(r));
  }

  console.log("\nInfrastructure:");
  for (const path of INFRA_URLS) {
    const r = await check(path);
    results.push(r);
    console.log(fmtRow(r));
  }

  console.log("\nDeprecated slugs (must 404):");
  for (const path of SHOULD_404) {
    const r = await check(path, { expect404: true });
    results.push(r);
    console.log(fmtRow(r));
  }

  const failures = results.filter((r) => !r.ok);
  console.log(
    `\nChecked ${results.length} URLs — ${failures.length} failure(s).`,
  );

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(fmtRow(f));
    process.exit(1);
  } else {
    console.log("All good.");
  }
}

main().catch((err) => {
  console.error("link checker crashed:", err);
  process.exit(2);
});
