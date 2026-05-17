import type { LeadMode } from "@prisma/client";
import { isLandingPlatformWebsite } from "@/src/lib/scoring";

interface LeadInsightInput {
  mode: LeadMode;
  website: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  category: string | null;
  city: string | null;
  notes: string | null;
  painPoints: string[];
  hasOnlineBooking: boolean;
  followers?: number | null;
  lookingForType?: boolean | null;
  audit: {
    issues: string[];
    hasSSL?: boolean;
    mobileFriendly?: boolean;
    createdAt?: Date;
  } | null;
  updatedAt: Date;
}

export interface SearchContextMeta {
  offer: string | null;
  language: string | null;
}

export interface ScoreBreakdownItem {
  label: string;
  points: number;
}

export interface LeadInsights {
  why: string;
  suggestedAngle: string;
  scoreBreakdown: ScoreBreakdownItem[];
  searchContext: SearchContextMeta;
  lastCheckedAt: Date;
}

export function parseSearchContextNotes(notes: string | null): SearchContextMeta {
  const meta: SearchContextMeta = { offer: null, language: null };
  if (!notes) return meta;

  for (const row of notes.split(/\r?\n/)) {
    const [rawKey, ...rest] = row.split(":");
    const value = rest.join(":").trim();
    const key = rawKey?.trim().toLowerCase();
    if (!value) continue;
    if (key === "offer" || key === "service") meta.offer = value;
    if (key === "language") meta.language = value;
  }
  return meta;
}

export function buildLeadInsights(input: LeadInsightInput): LeadInsights {
  const context = parseSearchContextNotes(input.notes);
  const issues = input.audit?.issues ?? [];
  const signals = [
    ...issues.slice(0, 3),
    ...input.painPoints.slice(0, 3),
    !input.website ? "no website on file" : null,
    !input.hasOnlineBooking ? "no online booking signal" : null,
    !input.email ? "no email found yet" : null,
  ].filter((item): item is string => !!item);

  const offer = context.offer ?? defaultOfferForMode(input.mode);
  const why =
    signals.length > 0
      ? `This lead shows ${joinSignals(signals)}. Good fit for a ${offer} offer.`
      : `This lead matches the selected niche and location. Validate the website and contact data before outreach.`;

  return {
    why,
    suggestedAngle: buildSuggestedAngle(input, offer),
    scoreBreakdown: buildScoreBreakdown(input),
    searchContext: context,
    lastCheckedAt: input.audit?.createdAt ?? input.updatedAt,
  };
}

function buildSuggestedAngle(input: LeadInsightInput, offer: string): string {
  if (!input.website) {
    return `Pitch a new website or landing page that gives local customers a clear place to learn, trust, and contact the business.`;
  }

  const text = [...(input.audit?.issues ?? []), ...input.painPoints]
    .join(" ")
    .toLowerCase();

  if (/slow|mobile|viewport|завантаж|мобіль/i.test(text)) {
    return `Website redesign focused on mobile speed and better contact conversion.`;
  }
  if (/h1|title|seo|meta/i.test(text)) {
    return `SEO and trust improvement for local customers searching on Google.`;
  }
  if (/contact|email|cta|reach|answer|дзв|контакт/i.test(text)) {
    return `Improve the contact path so visitors can request a service without friction.`;
  }
  if (!input.hasOnlineBooking) {
    return `Add clearer booking/contact flow around the ${offer} offer.`;
  }
  return `Use the audit as a concise proof point before pitching ${offer}.`;
}

function buildScoreBreakdown(input: LeadInsightInput): ScoreBreakdownItem[] {
  if (input.mode === "BEATS") {
    const followersBonus = input.followers
      ? Math.min(20, Math.floor(input.followers / 1000))
      : 0;
    return [
      { label: "Base opportunity", points: 50 },
      ...(input.lookingForType
        ? [{ label: "Publicly looking for type beats", points: 30 }]
        : []),
      ...(input.email ? [{ label: "Email found", points: 10 }] : []),
      ...(followersBonus > 0
        ? [{ label: "Audience size", points: followersBonus }]
        : []),
    ];
  }

  if (input.mode === "UNIVERSAL") {
    return [
      { label: "Base opportunity", points: 50 },
      ...(isLandingPlatformWebsite(input.website)
        ? [{ label: "Landing/social-only web presence", points: 40 }]
        : []),
      ...(input.email ? [{ label: "Email found", points: 10 }] : []),
      ...(input.audit?.hasSSL ? [{ label: "SSL present", points: -30 }] : []),
      ...(input.audit?.mobileFriendly
        ? [{ label: "Mobile-friendly page", points: -20 }]
        : []),
    ];
  }

  return [
    { label: "Base opportunity", points: 50 },
    ...(!input.website ? [{ label: "No website on file", points: 15 }] : []),
    ...(!input.hasOnlineBooking
      ? [{ label: "No booking/contact conversion signal", points: 20 }]
      : []),
    ...(input.painPoints.length > 0
      ? [{ label: "Public pain signals found", points: 30 }]
      : []),
    ...(input.audit && !input.audit.hasSSL
      ? [{ label: "Missing SSL", points: 10 }]
      : []),
    ...(input.audit && !input.audit.mobileFriendly
      ? [{ label: "Mobile issue", points: 15 }]
      : []),
    ...(input.audit?.issues.length
      ? [
          {
            label: `${input.audit.issues.length} website issue${
              input.audit.issues.length === 1 ? "" : "s"
            } found`,
            points: Math.min(25, input.audit.issues.length * 5),
          },
        ]
      : []),
  ];
}

function defaultOfferForMode(mode: LeadMode): string {
  if (mode === "BEATS") return "beat licensing";
  return "website redesign";
}

function joinSignals(signals: string[]): string {
  if (signals.length === 1) return signals[0] ?? "";
  if (signals.length === 2) return signals.join(" and ");
  return `${signals.slice(0, -1).join(", ")}, and ${signals.at(-1)}`;
}
