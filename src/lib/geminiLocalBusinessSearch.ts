import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 10;

export interface LocalBusinessHit {
  companyName: string;
  website: string | null;
  phone: string | null;
}

function buildPrompt(niche: string, city: string): string {
  const n = JSON.stringify(niche.trim());
  const c = JSON.stringify(city.trim());
  return `You help find real local businesses for B2B sales outreach.

Use Google Search to find businesses matching:
- Niche / business type: ${n}
- City or area served: ${c}

Rules:
- Return at most ${MAX_RESULTS} distinct real businesses (not directories as a single row unless one clear brand).
- Prefer businesses with a public official website. Include a phone only if it appears on authoritative public pages.
- Do NOT invent company names, URLs, or phone numbers. If unknown, use null for that field.
- "website" must be a full http(s) URL when present, or null.

Return ONLY a valid JSON array. No markdown code fences, no text before or after the array.
Each object must have exactly these keys: "companyName" (string, required), "website" (string or null), "phone" (string or null).

Example:
[{"companyName":"Example Clinic","website":"https://example.com","phone":"+380501234567"}]`;
}

function stripJsonFences(raw: string): string {
  let cleaned = raw
    .replace(/^\uFEFF/, "")
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

/**
 * Local-business discovery via Gemini + Google Search grounding (serverless-friendly).
 */
export async function searchLocalBusinessesViaGemini(
  niche: string,
  city: string,
  apiKey: string,
): Promise<LocalBusinessHit[]> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(niche, city),
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

    out.push({
      companyName: companyName.slice(0, 500),
      website,
      phone: phoneRaw,
    });
    if (out.length >= MAX_RESULTS) break;
  }

  return out;
}
