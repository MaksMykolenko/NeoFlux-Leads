"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { runAuditForLead } from "@/src/actions/auditActions";

interface AuditButtonProps {
  leadId: string;
  hasAudit: boolean;
  issuesCount?: number;
}

export default function AuditButton({
  leadId,
  hasAudit,
  issuesCount,
}: AuditButtonProps) {
  const t = useTranslations("AuditButton");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function issuesLabel(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return t("issuesOne", { count });
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return t("issuesFew", { count });
    }
    return t("issuesMany", { count });
  }

  async function handleClick() {
    setLoading(true);
    try {
      const result = await runAuditForLead(leadId);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (hasAudit) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-xs font-medium text-green-700 dark:text-emerald-300">
          {t("done")}
        </span>
        {issuesCount !== undefined && issuesCount > 0 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {issuesLabel(issuesCount)}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:hover:bg-flux-purple-ring/40 dark:focus-visible:ring-flux-purple"
    >
      {loading ? (
        <>
          <svg
            className="h-3 w-3 animate-spin text-purple-700 dark:text-flux-purple-soft"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {t("running")}
        </>
      ) : (
        t("run")
      )}
    </button>
  );
}
