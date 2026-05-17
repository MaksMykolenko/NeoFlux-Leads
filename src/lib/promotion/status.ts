export const FLUX_PROMOTE_STATUSES = [
  "New",
  "Qualified",
  "Message drafted",
  "Contacted",
  "Replied",
  "Interested",
  "Testing",
  "Partner",
  "Converted",
  "Not interested",
  "Do not contact",
] as const;

export type FluxPromoteStatus = (typeof FLUX_PROMOTE_STATUSES)[number];

export function isFluxPromoteStatus(value: string): value is FluxPromoteStatus {
  return FLUX_PROMOTE_STATUSES.includes(value as FluxPromoteStatus);
}

export function isFluxPromoteDoNotContact(status: string | null | undefined): boolean {
  return status === "Do not contact";
}

export function canDraftFluxPromoteMessage(
  status: string | null | undefined,
): boolean {
  return !isFluxPromoteDoNotContact(status);
}
