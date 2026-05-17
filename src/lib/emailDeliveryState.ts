export type DeliveryStatus = "DRAFT" | "FAILED" | "SENDING" | "SENT";

export type MessageClaimReason = "ALREADY_SENT" | "IN_FLIGHT" | "NOT_FOUND";

export function isClaimableDeliveryStatus(status: string | null): boolean {
  return status === "DRAFT" || status === "FAILED";
}

export function claimReasonForDeliveryStatus(
  status: string | null,
): MessageClaimReason {
  if (status === null) return "NOT_FOUND";
  if (status === "SENT") return "ALREADY_SENT";
  return "IN_FLIGHT";
}
