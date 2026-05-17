import type { LeadMode } from "@/src/lib/leadMode";

export interface ScoringLead {
  website: string | null;
  email: string | null;
}

export interface ScoringAudit {
  hasSSL: boolean;
  mobileFriendly: boolean;
  issues?: string[];
}

export interface ScoringArtist {
  email: string | null;
  followers: number | null;
  lookingForType: boolean | null;
}

export interface ScoringLocalLead {
  website: string | null;
  hasOnlineBooking: boolean;
  painPoints: string[];
}

export const SCORE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
} as const;

export type ScoreLevel = "high" | "medium" | "low";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= SCORE_THRESHOLDS.HIGH) return "high";
  if (score >= SCORE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function calculateLocalLeadScore(
  input: ScoringLocalLead,
  audit: ScoringAudit | null = null,
): number {
  let score = 50;
  if (!input.website) score += 15;
  if (!input.hasOnlineBooking) score += 20;
  if (input.painPoints.length > 0) score += 30;
  if (audit) {
    if (!audit.hasSSL) score += 10;
    if (!audit.mobileFriendly) score += 15;
    const issueBonus = Math.min(25, (audit.issues?.length ?? 0) * 5);
    score += issueBonus;
  }
  return Math.max(0, Math.min(100, score));
}

const BASE_SCORE = 50;

const SSL_PENALTY = 30;
const MOBILE_PENALTY = 20;
const LANDING_PLATFORM_BONUS = 40;
const EMAIL_BONUS = 10;

const TYPE_BUYER_BONUS = 30;
const FOLLOWERS_PER_POINT = 1000;
const FOLLOWERS_BONUS_CAP = 20;

const LANDING_PLATFORM_PATTERN =
  /instagram\.com|choiceqr\.(?:com|app)|linktr\.ee|facebook\.com\/(?!sharer)/i;

export function isLandingPlatformWebsite(website: string | null): boolean {
  if (!website) return false;
  return LANDING_PLATFORM_PATTERN.test(website);
}

/**
 * Opportunity Score (0-100). Higher = more "pain" the prospect has =
 * better target for a sales conversation about a new website / landing page.
 */
export function calculateLeadScore(
  lead: ScoringLead,
  audit: ScoringAudit | null,
): number {
  let score = BASE_SCORE;

  if (audit?.hasSSL) score -= SSL_PENALTY;
  if (audit?.mobileFriendly) score -= MOBILE_PENALTY;

  if (isLandingPlatformWebsite(lead.website)) score += LANDING_PLATFORM_BONUS;
  if (lead.email) score += EMAIL_BONUS;

  return Math.max(0, Math.min(100, score));
}

/**
 * Opportunity Score for BEATS-mode artist prospects.
 */
export function calculateArtistScore(artist: ScoringArtist): number {
  let score = BASE_SCORE;

  if (artist.lookingForType) score += TYPE_BUYER_BONUS;
  if (artist.email) score += EMAIL_BONUS;

  if (artist.followers && artist.followers > 0) {
    const fb = Math.min(
      FOLLOWERS_BONUS_CAP,
      Math.floor(artist.followers / FOLLOWERS_PER_POINT),
    );
    score += fb;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Mode-aware shape for `recalculateLeadScore`. Compatible with a full Prisma
 * `Lead` row — pass it directly.
 */
export interface RecalcLeadInput {
  mode: LeadMode;
  website?: string | null;
  email?: string | null;
  hasOnlineBooking?: boolean | null;
  painPoints?: string[] | null;
  followers?: number | null;
  lookingForType?: boolean | null;
}

/**
 * Єдина точка перерахунку Opportunity Score. Диспатчить по `mode`:
 *   LOCAL     → `calculateLocalLeadScore`  (painPoints + booking signals)
 *   BEATS     → `calculateArtistScore`     (followers + type-buyer + email)
 *   UNIVERSAL → `calculateLeadScore`       (audit booleans + landing platform + email)
 *
 * LOCAL бере audit-сигнали після перевірки сайту; BEATS їх ігнорує.
 */
export function recalculateLeadScore(
  lead: RecalcLeadInput,
  audit: ScoringAudit | null,
): number {
  switch (lead.mode) {
    case "BEATS":
      return calculateArtistScore({
        email: lead.email ?? null,
        followers: lead.followers ?? null,
        lookingForType: lead.lookingForType ?? null,
      });
    case "UNIVERSAL":
      return calculateLeadScore(
        { website: lead.website ?? null, email: lead.email ?? null },
        audit,
      );
    case "LOCAL":
    default:
      return calculateLocalLeadScore({
        website: lead.website ?? null,
        hasOnlineBooking: lead.hasOnlineBooking ?? false,
        painPoints: lead.painPoints ?? [],
      }, audit);
  }
}

/**
 * Брендова палітра для пілюлі/бейджика скору. HIGH — флакс-фіолетовий,
 * MEDIUM/LOW — нейтральні відтінки zinc (без яскравого зеленого/червоного).
 * Повертає одну строку Tailwind-класів готову до вставки в `className`.
 */
export function getScoreColorClass(score: number): string {
  const level = getScoreLevel(score);
  if (level === "high") {
    return "border-purple-300 bg-purple-50 text-purple-700 dark:border-flux-purple/40 dark:bg-flux-purple/15 dark:text-flux-purple-soft";
  }
  if (level === "medium") {
    return "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-300";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-500";
}

export interface ScoreContext {
  textColor: string;
  barColor: string;
  ringColor: string;
  bgColor: string;
  labelKey: ScoreLevel;
  level: ScoreLevel;
}

/**
 * Розширена палітра для великого score-card на детальній сторінці. Узгоджена
 * з `SCORE_THRESHOLDS` та брендовою палітрою.
 */
export function getScoreContext(score: number): ScoreContext {
  const level = getScoreLevel(score);
  if (level === "high") {
    return {
      textColor: "text-purple-700 dark:text-flux-purple-soft",
      barColor: "bg-purple-500 dark:bg-flux-purple",
      ringColor: "ring-purple-200 dark:ring-flux-purple/30",
      bgColor: "bg-purple-50 dark:bg-flux-purple/15",
      labelKey: "high",
      level: "high",
    };
  }
  if (level === "medium") {
    return {
      textColor: "text-zinc-700 dark:text-zinc-200",
      barColor: "bg-zinc-400 dark:bg-zinc-500",
      ringColor: "ring-zinc-200 dark:ring-flux-border",
      bgColor: "bg-zinc-50 dark:bg-flux-card-2",
      labelKey: "medium",
      level: "medium",
    };
  }
  return {
    textColor: "text-zinc-500 dark:text-zinc-400",
    barColor: "bg-zinc-300 dark:bg-zinc-600",
    ringColor: "ring-zinc-200 dark:ring-flux-border",
    bgColor: "bg-zinc-50 dark:bg-flux-card-2",
    labelKey: "low",
    level: "low",
  };
}
