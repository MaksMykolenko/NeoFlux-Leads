export interface ScoringLead {
  website: string | null;
  email: string | null;
}

export interface ScoringAudit {
  hasSSL: boolean;
  mobileFriendly: boolean;
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

export function calculateLocalLeadScore(input: ScoringLocalLead): number {
  let score = 50;
  if (!input.website) score += 15;
  if (!input.hasOnlineBooking) score += 20;
  if (input.painPoints.length > 0) score += 30;
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

// Patterns that indicate the business uses a no-code/social profile in lieu of
// a real website — these are prime targets for a landing-page upsell.
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
  audit: ScoringAudit | null
): number {
  let score = BASE_SCORE;

  if (audit?.hasSSL) score -= SSL_PENALTY;
  if (audit?.mobileFriendly) score -= MOBILE_PENALTY;

  if (isLandingPlatformWebsite(lead.website)) score += LANDING_PLATFORM_BONUS;
  if (lead.email) score += EMAIL_BONUS;

  return Math.max(0, Math.min(100, score));
}

/**
 * Opportunity Score for BEATS-mode artist prospects. Higher = better target
 * for a beat-pitch DM. Public "type beat" search signals + reachable email +
 * audience size are the main positive drivers.
 */
export function calculateArtistScore(artist: ScoringArtist): number {
  let score = BASE_SCORE;

  if (artist.lookingForType) score += TYPE_BUYER_BONUS;
  if (artist.email) score += EMAIL_BONUS;

  if (artist.followers && artist.followers > 0) {
    const fb = Math.min(
      FOLLOWERS_BONUS_CAP,
      Math.floor(artist.followers / FOLLOWERS_PER_POINT)
    );
    score += fb;
  }

  return Math.max(0, Math.min(100, score));
}

export interface ScoreContext {
  textColor: string;
  barColor: string;
  ringColor: string;
  bgColor: string;
  /** i18n key suffix: `LeadDetail.score.label.${labelKey}` */
  labelKey: "high" | "medium" | "low";
  level: "high" | "medium" | "low";
}

export function getScoreContext(score: number): ScoreContext {
  if (score > 70) {
    return {
      textColor: "text-green-600",
      barColor: "bg-green-500",
      ringColor: "ring-green-200",
      bgColor: "bg-green-50",
      labelKey: "high",
      level: "high",
    };
  }
  if (score > 40) {
    return {
      textColor: "text-amber-600",
      barColor: "bg-amber-500",
      ringColor: "ring-amber-200",
      bgColor: "bg-amber-50",
      labelKey: "medium",
      level: "medium",
    };
  }
  return {
    textColor: "text-red-600",
    barColor: "bg-red-500",
    ringColor: "ring-red-200",
    bgColor: "bg-red-50",
    labelKey: "low",
    level: "low",
  };
}
