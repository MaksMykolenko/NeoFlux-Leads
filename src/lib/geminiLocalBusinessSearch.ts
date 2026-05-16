import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 10;
const MAX_PAIN_POINTS = 5;

export interface LocalBusinessHit {
  companyName: string;
  website: string | null;
  phone: string | null;
  painPoints: string[];
  hasOnlineBooking: boolean;
}

function buildPrompt(
  niche: string,
  city: string,
  region: string | null,
): string {
  const n = JSON.stringify(niche.trim());
  const c = JSON.stringify(city.trim());
  const regionLine =
    region && region.trim()
      ? `\nFocus search exclusively on entities located in or targeting: ${JSON.stringify(
          region.trim(),
        )}.\n`
      : "";
  return `You help find real local businesses for B2B sales outreach.

Use Google Search to find businesses matching:
- Niche / business type: ${n}
- City or area served: ${c}${regionLine}

For every business, you MUST analyze Google search snippets, public review excerpts,
business descriptions, social-media pages, and any directory listings (Google Maps,
Yelp, TripAdvisor, Facebook, etc.) to derive:
- "painPoints": short tag-like English strings (max 3 words each) that describe
  recurring operational friction visible from public signals. Examples of valid
  tags: "no answer", "hard to reach", "slow website", "outdated site",
  "no online ordering", "no menu online", "missed calls", "poor reviews",
  "no instagram", "no email visible". Use lowercase, no punctuation. Return at most
  ${MAX_PAIN_POINTS} tags. Empty array [] if no friction is observable.
- "hasOnlineBooking": true ONLY when a real online booking, reservation, or
  appointment widget is publicly observable (Calendly link, Booksy, Fresha,
  OpenTable, SimplyBook, Setmore, "Book now"/"Reserve" CTA on official site,
  or a Stripe/payment-linked booking page). Otherwise false. When unsure → false.

Rules:
- Return at most ${MAX_RESULTS} distinct real businesses (not directories as a
  single row unless one clear brand).
- Prefer businesses with a public official website. Include a phone only if it
  appears on authoritative public pages.
- Do NOT invent company names, URLs, phone numbers, pain points, or booking
  capabilities. If unknown, use null/false/[].
- "website" must be a full http(s) URL when present, or null.

Return ONLY a valid JSON array. No markdown code fences, no text before or after.
Each object MUST have exactly these keys:
"companyName" (string, required),
"website" (string or null),
"phone" (string or null),
"painPoints" (string[]),
"hasOnlineBooking" (boolean).

Example:
[{"companyName":"Example Clinic","website":"https://example.com","phone":"+380501234567","painPoints":["no answer","slow website"],"hasOnlineBooking":false}]`;
}

function stripJsonFences(raw: string): string {
  let cleaned = raw
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  return cleaned;
}

function normalizeWebsite(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  let w = raw.trim();
  if (!/^https?:\/\//i.test(w)) {
    if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(w)) {
      w = `https://${w}`;
    } else {
      return null;
    }
  }
  try {
    const u = new URL(w);
    if (/google\./i.test(u.hostname) && u.pathname.includes("/maps")) {
      return null;
    }
  } catch {
    return null;
  }
  return w.slice(0, 2048);
}

function normalizePainPoints(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const cleaned = item.trim().toLowerCase().replace(/[.!?;,]+$/g, "");
    if (!cleaned || cleaned.length > 60) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= MAX_PAIN_POINTS) break;
  }
  return out;
}

export async function searchLocalBusinessesViaGemini(
  niche: string,
  city: string,
  apiKey: string,
  region: string | null = null,
): Promise<LocalBusinessHit[]> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(niche, city, region),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.25,
    },
  });

  const text = response.text?.trim();
  if (!text) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const out: LocalBusinessHit[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const companyName =
      typeof rec.companyName === "string"
        ? rec.companyName.trim()
        : typeof rec.name === "string"
          ? rec.name.trim()
          : "";
    if (!companyName) continue;

    const website = normalizeWebsite(
      typeof rec.website === "string" ? rec.website : null,
    );

    const phoneRaw =
      typeof rec.phone === "string" && rec.phone.trim()
        ? rec.phone.trim().slice(0, 64)
        : null;

    const painPoints = normalizePainPoints(rec.painPoints);
    const hasOnlineBooking = rec.hasOnlineBooking === true;

    out.push({
      companyName: companyName.slice(0, 500),
      website,
      phone: phoneRaw,
      painPoints,
      hasOnlineBooking,
    });
    if (out.length >= MAX_RESULTS) break;
  }

  return out;
}
