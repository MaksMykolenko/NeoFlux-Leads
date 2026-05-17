import type { Prisma } from "@prisma/client";

export const LEAD_FILTERS = [
  "hasEmail",
  "score70",
  "notContacted",
  "hasWebsite",
  "hasPhone",
  "websiteIssues",
  "contacted",
  "replied",
  "noEmail",
] as const;

export type LeadFilter = (typeof LEAD_FILTERS)[number];

export function parseLeadFilters(
  value: string | string[] | undefined,
): LeadFilter[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const parts = raw.flatMap((item) => item.split(","));
  const known = new Set<string>(LEAD_FILTERS);
  return Array.from(
    new Set(parts.filter((item): item is LeadFilter => known.has(item))),
  );
}

export function applyLeadFilters(
  where: Prisma.LeadWhereInput,
  filters: LeadFilter[],
): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];

  for (const filter of filters) {
    if (filter === "hasEmail") {
      and.push({ email: { not: null } });
    } else if (filter === "score70") {
      and.push({ score: { gte: 70 } });
    } else if (filter === "notContacted") {
      and.push({ status: { in: ["New", "Qualified"] } });
    } else if (filter === "hasWebsite") {
      and.push({ website: { not: null } });
    } else if (filter === "hasPhone") {
      and.push({ phone: { not: null } });
    } else if (filter === "websiteIssues") {
      and.push({ audit: { is: { issues: { isEmpty: false } } } });
    } else if (filter === "contacted") {
      and.push({ status: "Contacted" });
    } else if (filter === "replied") {
      and.push({ status: "Replied" });
    } else if (filter === "noEmail") {
      and.push({ email: null });
    }
  }

  if (and.length === 0) return where;
  return {
    AND: [where, ...and],
  };
}
