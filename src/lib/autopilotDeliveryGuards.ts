import type { Prisma } from "@prisma/client";

export const DO_NOT_CONTACT_STATUS = "Do not contact";

export function pendingDeliveryLeadWhere(): Prisma.LeadWhereInput {
  return {
    pipelineStatus: "PENDING_DELIVERY",
    status: { not: DO_NOT_CONTACT_STATUS },
  };
}

export function pendingDoNotContactLeadWhere(): Prisma.LeadWhereInput {
  return {
    pipelineStatus: "PENDING_DELIVERY",
    status: DO_NOT_CONTACT_STATUS,
  };
}
