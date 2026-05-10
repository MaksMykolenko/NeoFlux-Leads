export const LEAD_STATUSES = [
  "New",
  "Qualified",
  "Contacted",
  "Replied",
  "Won",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-200",
  Qualified: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  Replied: "bg-purple-50 text-purple-700 ring-purple-200",
  Won: "bg-green-50 text-green-700 ring-green-200",
  Lost: "bg-red-50 text-red-700 ring-red-200",
};

export function getStatusClasses(status: string): string {
  if (isLeadStatus(status)) return STATUS_STYLES[status];
  return "bg-gray-50 text-gray-700 ring-gray-200";
}
