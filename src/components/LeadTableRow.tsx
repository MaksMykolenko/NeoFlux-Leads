"use client";

import { Link, useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { LeadMode } from "@/src/lib/leadMode";
import {
  parseContacts,
  resolveBeatsProfileHref,
  resolveUniversalSiteHref,
} from "@/src/lib/channels";
import AuditButton from "@/src/components/AuditButton";
import StatusPill from "@/src/components/StatusPill";

interface LeadRowProps {
  lead: {
    id: string;
    mode: LeadMode;
    companyName: string;
    category: string | null;
    city: string | null;
    website: string | null;
    socialLinks?: unknown;
    status: string;
    source: string | null;
    followers: number | null;
    lookingForType: boolean | null;
    notes?: string | null;
    audit: { issues: string[] } | null;
    score: number;
    painPoints: string[];
    hasOnlineBooking: boolean;
  };
  selection?: {
    selected: boolean;
    onToggle: (id: string, next: boolean) => void;
  };
}

const HIGH_SCORE_THRESHOLD = 80;

function stopPropagation(e: React.MouseEvent | React.KeyboardEvent) {
  e.stopPropagation();
}

function fmtFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

export default function LeadTableRow({ lead, selection }: LeadRowProps) {
  const router = useRouter();
  const t = useTranslations("LeadTableRow");
  const isBeats = lead.mode === LeadMode.BEATS;
  const isUniversal = lead.mode === LeadMode.UNIVERSAL;
  const isHighScore = lead.score >= HIGH_SCORE_THRESHOLD;

  const profileHref = isBeats
    ? resolveBeatsProfileHref(
        lead.website,
        parseContacts(lead.socialLinks ?? null) ?? undefined,
      )
    : null;

  const universalHref = isUniversal
    ? resolveUniversalSiteHref(lead.website, lead.socialLinks)
    : null;

  const siteHref = isBeats
    ? profileHref
    : isUniversal
      ? universalHref
      : lead.website
        ? lead.website.trim() || null
        : null;

  const subtitle = isBeats
    ? lead.source ?? null
    : isUniversal
      ? null
      : lead.city ?? null;

  const rowBase =
    "cursor-pointer border-l-2 transition-colors hover:bg-zinc-100/70 dark:hover:bg-flux-card-2";
  const rowState = selection?.selected
    ? "bg-purple-50 dark:bg-flux-purple/10"
    : "";
  const rowAccent = isHighScore
    ? "border-l-purple-500 dark:border-l-flux-purple"
    : "border-l-transparent";

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={`${rowBase} ${rowAccent} ${rowState}`}
    >
      {selection && (
        <td className="px-4 py-4 align-middle" onClick={stopPropagation}>
          <input
            type="checkbox"
            checked={selection.selected}
            onChange={(e) => selection.onToggle(lead.id, e.target.checked)}
            aria-label={`Select ${lead.companyName}`}
            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-purple-500 focus:ring-purple-500 dark:border-zinc-700 dark:bg-flux-card"
          />
        </td>
      )}
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Link
            href={`/leads/${lead.id}`}
            onClick={stopPropagation}
            className="text-zinc-900 transition-colors hover:text-purple-600 hover:underline dark:text-zinc-100 dark:hover:text-flux-purple-soft"
          >
            {lead.companyName}
          </Link>
          <ScorePill score={lead.score} />
        </div>
      </td>
      <td className="max-w-md px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
        {isUniversal ? (
          lead.notes ? (
            <span className="line-clamp-2 break-words" title={lead.notes}>
              {lead.notes}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600">—</span>
          )
        ) : (
          <span className="whitespace-nowrap">
            {lead.category}
            {subtitle && (
              <span className="text-zinc-400 dark:text-zinc-500">
                {" "}
                · {subtitle}
              </span>
            )}
          </span>
        )}
        {!isBeats && !isUniversal && (
          <PainTags points={lead.painPoints} booking={lead.hasOnlineBooking} />
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        {siteHref ? (
          <a
            href={siteHref}
            onClick={stopPropagation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 transition-colors hover:text-purple-700 hover:underline dark:text-flux-purple-soft dark:hover:text-white"
          >
            {siteHref.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-flux-card-2 dark:text-zinc-400">
            {t("noLink")}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <StatusPill status={lead.status} />
      </td>
      <td
        className="whitespace-nowrap px-6 py-4 text-sm"
        onClick={stopPropagation}
      >
        {isBeats ? (
          <BeatsLastCell
            followers={lead.followers}
            lookingForType={lead.lookingForType}
            followersLabel={
              lead.followers != null
                ? t("followers", { count: fmtFollowers(lead.followers) })
                : ""
            }
            seekingLabel={t("seekingType")}
          />
        ) : lead.website ? (
          <AuditButton
            leadId={lead.id}
            hasAudit={!!lead.audit}
            issuesCount={lead.audit?.issues.length}
          />
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
        )}
      </td>
    </tr>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= HIGH_SCORE_THRESHOLD
      ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-flux-purple/40 dark:bg-flux-purple/15 dark:text-flux-purple-soft"
      : score >= 50
        ? "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-300"
        : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-500";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums tracking-wider ${tone}`}
    >
      {score}
    </span>
  );
}

function PainTags({
  points,
  booking,
}: {
  points: string[];
  booking: boolean;
}) {
  if (points.length === 0 && booking) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {!booking && (
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          no booking
        </span>
      )}
      {points.slice(0, 3).map((p) => (
        <span
          key={p}
          className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-flux-border dark:bg-flux-card dark:text-zinc-300"
        >
          {p}
        </span>
      ))}
      {points.length > 3 && (
        <span className="inline-flex items-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          +{points.length - 3}
        </span>
      )}
    </div>
  );
}

function BeatsLastCell({
  followers,
  lookingForType,
  followersLabel,
  seekingLabel,
}: {
  followers: number | null;
  lookingForType: boolean | null;
  followersLabel: string;
  seekingLabel: string;
}) {
  if (followers == null && !lookingForType) {
    return <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>;
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      {followers != null && (
        <span className="text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
          {followersLabel}
        </span>
      )}
      {lookingForType && (
        <span className="inline-flex items-center whitespace-nowrap rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
          {seekingLabel}
        </span>
      )}
    </div>
  );
}
