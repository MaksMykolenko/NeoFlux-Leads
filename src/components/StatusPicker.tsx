"use client";

import { useState, useTransition } from "react";
import {
  LEAD_STATUSES,
  getStatusClasses,
  type LeadStatus,
} from "@/src/lib/leadStatus";
import { updateLeadStatus } from "@/src/actions/statusActions";

interface StatusPickerProps {
  leadId: string;
  initialStatus: string;
}

export default function StatusPicker({
  leadId,
  initialStatus,
}: StatusPickerProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as LeadStatus;
    const previous = status;

    setStatus(next);
    setError(null);

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, next);
      if (!result.success) {
        setStatus(previous);
        setError(result.error ?? "Не вдалось оновити статус");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative inline-flex items-center">
        <select
          value={status}
          onChange={handleChange}
          disabled={isPending}
          aria-label="Статус ліда"
          className={`appearance-none cursor-pointer rounded-full pl-3.5 pr-9 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${getStatusClasses(
            status
          )}`}
        >
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value} className="bg-white text-gray-900">
              {value}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          {isPending ? (
            <svg
              className="h-3.5 w-3.5 animate-spin text-current opacity-70"
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
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 text-current opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </div>
      {error && (
        <span className="text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
}
