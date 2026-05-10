"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuditButton from "@/src/components/AuditButton";
import StatusPill from "@/src/components/StatusPill";

interface LeadRowProps {
  lead: {
    id: string;
    companyName: string;
    category: string | null;
    city: string | null;
    website: string | null;
    status: string;
    audit: { issues: string[] } | null;
  };
}

function stopPropagation(e: React.MouseEvent | React.KeyboardEvent) {
  e.stopPropagation();
}

export default function LeadTableRow({ lead }: LeadRowProps) {
  const router = useRouter();

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
        {lead.city && (
          <span className="text-gray-400"> · {lead.city}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {lead.website ? (
          <a
            href={lead.website}
            onClick={stopPropagation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
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
        {lead.website ? (
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
