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
  UNIVERSAL: "UNIVERSAL",
} as const satisfies Record<string, PrismaLeadMode>;

export type LeadMode = PrismaLeadMode;

export type LeadModeKey = "local" | "beats" | "universal";

export function modeFromQuery(value: string | string[] | undefined): LeadMode {
  if (Array.isArray(value)) value = value[0];
  if (value === "beats") return LeadMode.BEATS;
  if (value === "universal") return LeadMode.UNIVERSAL;
  return LeadMode.LOCAL;
}

export function modeKeyFromMode(mode: LeadMode): LeadModeKey {
  if (mode === LeadMode.BEATS) return "beats";
  if (mode === LeadMode.UNIVERSAL) return "universal";
  return "local";
}

export function isBeatsMode(mode: LeadMode): boolean {
  return mode === LeadMode.BEATS;
}

export function isUniversalMode(mode: LeadMode): boolean {
  return mode === LeadMode.UNIVERSAL;
}
