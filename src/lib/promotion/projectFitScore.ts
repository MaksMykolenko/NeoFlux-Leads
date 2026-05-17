import type { ProjectProfile } from "@/src/lib/promotion/fluxPromoteProfiles";

export interface FluxPromoteTargetSignal {
  name: string;
  audienceType?: string | null;
  platform?: string | null;
  sourceUrl?: string | null;
  websiteUrl?: string | null;
  socialUrl?: string | null;
  contactUrl?: string | null;
  email?: string | null;
  country?: string | null;
  language?: string | null;
  notes?: string | null;
}

export interface ProjectFitScoreBreakdownItem {
  points: number;
  reason: string;
}

export interface ProjectFitScoreResult {
  score: number;
  breakdown: ProjectFitScoreBreakdownItem[];
  reasons: string[];
}

export function calculateProjectFitScore({
  project,
  target,
  region,
  language,
}: {
  project: ProjectProfile;
  target: FluxPromoteTargetSignal;
  region?: string | null;
  language?: string | null;
}): ProjectFitScoreResult {
  const haystack = [
    target.name,
    target.audienceType,
    target.platform,
    target.country,
    target.language,
    target.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const breakdown: ProjectFitScoreBreakdownItem[] = [];

  if (
    project.targetAudiences.some((audience) =>
      hasTokenOverlap(haystack, audience),
    )
  ) {
    breakdown.push({ points: 25, reason: "Matches selected audience" });
  }

  if (project.keywords.some((keyword) => hasTokenOverlap(haystack, keyword))) {
    breakdown.push({ points: 20, reason: "Relevant niche activity detected" });
  }

  if (target.email || target.contactUrl || target.socialUrl || target.websiteUrl) {
    breakdown.push({ points: 15, reason: "Public contact or profile link exists" });
  }

  if (looksActive(haystack, target.sourceUrl, target.socialUrl)) {
    breakdown.push({ points: 15, reason: "Target appears active" });
  }

  if (looksLikeEarlyAdopter(haystack)) {
    breakdown.push({ points: 10, reason: "Likely early adopter" });
  }

  if (
    project.outreachAngles.some((angle) => hasTokenOverlap(haystack, angle)) ||
    project.valueProposition
      .split(/[,\s]+/)
      .some((token) => token.length > 4 && haystack.includes(token.toLowerCase()))
  ) {
    breakdown.push({
      points: 10,
      reason: "Project value proposition matches target context",
    });
  }

  if (matchesRegionOrLanguage(target, region, language)) {
    breakdown.push({ points: 5, reason: "Region or language match" });
  }

  const score = clampScore(
    breakdown.reduce((sum, item) => sum + item.points, 0),
  );

  return {
    score,
    breakdown,
    reasons: breakdown.map((item) => `+${item.points} ${item.reason}`),
  };
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasTokenOverlap(haystack: string, phrase: string): boolean {
  const tokens = phrase
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .filter((token) => token.length >= 4);
  return tokens.some((token) => haystack.includes(token));
}

function looksActive(
  haystack: string,
  sourceUrl?: string | null,
  socialUrl?: string | null,
): boolean {
  return Boolean(
    socialUrl ||
      sourceUrl ||
      /\b(active|posting|posts|builds|shares|maintainer|seller|creator|community)\b/i.test(
        haystack,
      ),
  );
}

function looksLikeEarlyAdopter(haystack: string): boolean {
  return /\b(open-source|github|beta|indie|builder|developer|creator|founder|maker|plugin|mod)\b/i.test(
    haystack,
  );
}

function matchesRegionOrLanguage(
  target: FluxPromoteTargetSignal,
  region?: string | null,
  language?: string | null,
): boolean {
  const selectedRegion = region?.trim().toLowerCase();
  const selectedLanguage = language?.trim().toLowerCase();
  const targetCountry = target.country?.trim().toLowerCase();
  const targetLanguage = target.language?.trim().toLowerCase();

  if (selectedLanguage && targetLanguage && selectedLanguage === targetLanguage) {
    return true;
  }
  if (!selectedRegion || selectedRegion === "global") return false;
  if (selectedRegion === "english-speaking") {
    return targetLanguage === "english" || targetCountry === "united states" || targetCountry === "uk";
  }
  return Boolean(targetCountry && selectedRegion === targetCountry);
}
