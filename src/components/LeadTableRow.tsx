"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeadMode } from "@/src/lib/leadMode";
import {
  parseContacts,
  resolveBeatsProfileHref,
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
    audit: { issues: string[] } | null;
  };
}

function stopPropagation(e: React.MouseEvent | React.KeyboardEvent) {
  e.stopPropagation();
}

function fmtFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

export default function LeadTableRow({ lead }: LeadRowProps) {
  const router = useRouter();
  const isBeats = lead.mode === LeadMode.BEATS;

  const profileHref = isBeats
    ? resolveBeatsProfileHref(
        lead.website,
        parseContacts(lead.socialLinks ?? null) ?? undefined
      )
    : null;
  const siteHref =
    isBeats ? profileHref : lead.website ? lead.website.trim() || null : null;

  const subtitle = isBeats
    ? lead.source ?? null
    : lead.city ?? null;

  return (
    <tr
      onClick={() => router.push(`/leads/${lead.id}`)}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
        <Link
          href={`/leads/${lead.id}`}
          onClick={stopPropagation}
          className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
        >
          {lead.companyName}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {lead.category}
        {subtitle && (
          <span className="text-gray-400"> · {subtitle}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {siteHref ? (
          <a
            href={siteHref}
            onClick={stopPropagation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {siteHref.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            Немає
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        <StatusPill status={lead.status} />
      </td>
      <td
        className="px-6 py-4 text-sm whitespace-nowrap"
        onClick={stopPropagation}
      >
        {isBeats ? (
          <BeatsLastCell
            followers={lead.followers}
            lookingForType={lead.lookingForType}
          />
        ) : lead.website ? (
          <AuditButton
            leadId={lead.id}
            hasAudit={!!lead.audit}
            issuesCount={lead.audit?.issues.length}
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

function BeatsLastCell({
  followers,
  lookingForType,
}: {
  followers: number | null;
  lookingForType: boolean | null;
}) {
  if (followers == null && !lookingForType) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      {followers != null && (
        <span className="text-xs font-medium text-gray-700 tabular-nums">
          {fmtFollowers(followers)}
        </span>
      )}
      {lookingForType && (
        <span className="inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 whitespace-nowrap">
          шукає type beats
        </span>
      )}
    </div>
  );
}
