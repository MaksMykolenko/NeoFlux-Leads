import { LeadMode } from "@prisma/client";

export { LeadMode };

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
