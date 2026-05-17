"use client";

import { useTranslations } from "next-intl";
import { getStatusClasses, isLeadStatus } from "@/src/lib/leadStatus";

interface StatusPillProps {
  status: string;
}

export default function StatusPill({ status }: StatusPillProps) {
  const t = useTranslations("LeadStatus");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
        status,
      )}`}
    >
      {isLeadStatus(status) ? t(status) : status}
    </span>
  );
}
