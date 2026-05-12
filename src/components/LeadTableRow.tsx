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
  };
  /** Bulk-selection mode. When defined, the row renders a checkbox cell. */
  selection?: {
    selected: boolean;
    onToggle: (id: string, next: boolean) => void;
  };
}

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

  const profileHref = isBeats
    ? resolveBeatsProfileHref(
        lead.website,
        parseContacts(lead.socialLinks ?? null) ?? undefined
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

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
        selection?.selected ? "bg-cyan-50/50 dark:bg-cyan-500/10" : ""
      }`}
    >
      {selection && (
        <td
          className="px-4 py-4 align-middle"
          onClick={stopPropagation}
        >
          <input
            type="checkbox"
            checked={selection.selected}
            onChange={(e) => selection.onToggle(lead.id, e.target.checked)}
            aria-label={`Select ${lead.companyName}`}
            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-cyan-500 focus:ring-cyan-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </td>
      )}
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
        <Link
          href={`/leads/${lead.id}`}
          onClick={stopPropagation}
          className="text-zinc-900 transition-colors hover:text-cyan-600 hover:underline dark:text-zinc-100 dark:hover:text-cyan-400 "
        >
          {lead.companyName}
        </Link>
      </td>
      <td className="max-w-md px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
        {isUniversal ? (
          lead.notes ? (
            <span className="line-clamp-2 break-words" title={lead.notes}>
              {lead.notes}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600 ">—</span>
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
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        {siteHref ? (
          <a
            href={siteHref}
            onClick={stopPropagation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 transition-colors hover:text-cyan-700 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            {siteHref.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
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
                ? t("followers", {
                    count: fmtFollowers(lead.followers),
                  })
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
          <span className="text-xs text-zinc-400 dark:text-zinc-600 ">—</span>
        )}
      </td>
    </tr>
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
    return <span className="text-xs text-zinc-400 dark:text-zinc-600 ">—</span>;
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      {followers != null && (
        <span className="text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
          {followersLabel}
        </span>
      )}
      {lookingForType && (
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30">
          {seekingLabel}
        </span>
      )}
    </div>
  );
}
