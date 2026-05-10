import type { LeadMode as PrismaLeadMode } from "@prisma/client";

/**
 * Runtime mirror of the Prisma `LeadMode` enum.
 *
 * Prisma's generated client ships its enums as a CJS const object. Under
 * Turbopack + Next dev server, the client module sometimes fails to resolve
 * to a value at runtime when the client was regenerated mid-session, leaving
 * `LeadMode` as `undefined` and producing
 * `Cannot read properties of undefined (reading 'LOCAL')`. Defining the
 * constants ourselves removes that interop dependency entirely while keeping
 * the canonical type imported from Prisma so any future schema rename will
 * surface as a type error here.
 */
export const LeadMode = {
  LOCAL: "LOCAL",
  BEATS: "BEATS",
} as const satisfies Record<string, PrismaLeadMode>;

export type LeadMode = PrismaLeadMode;

export type LeadModeKey = "local" | "beats";

export function modeFromQuery(value: string | string[] | undefined): LeadMode {
  if (Array.isArray(value)) value = value[0];
  return value === "beats" ? LeadMode.BEATS : LeadMode.LOCAL;
}

export function modeKeyFromMode(mode: LeadMode): LeadModeKey {
  return mode === LeadMode.BEATS ? "beats" : "local";
}

export function isBeatsMode(mode: LeadMode): boolean {
  return mode === LeadMode.BEATS;
}
