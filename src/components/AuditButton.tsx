"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        <span className="text-xs font-medium text-green-700">Аудит пройдено</span>
        {issuesCount !== undefined && issuesCount > 0 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {issuesCount} {issuesCount === 1 ? "проблема" : issuesCount < 5 ? "проблеми" : "проблем"}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-3 w-3 text-purple-700"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          Аналізуємо…
        </>
      ) : (
        "Зробити аудит"
      )}
    </button>
  );
}
