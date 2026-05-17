export function canUseFluxPromote(
  user: { role: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  const role = normalizeFluxPromoteRole(user.role);
  return role === "ADMIN" || role === "OWNER";
}

export type FluxPromoteAccessResult =
  | { ok: true }
  | { ok: false; status: 403; error: "FORBIDDEN" };

export function checkFluxPromoteAccess(
  user: { role: string | null } | null | undefined,
): FluxPromoteAccessResult {
  if (!canUseFluxPromote(user)) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }
  return { ok: true };
}

export function normalizeFluxPromoteRole(
  role: string | null | undefined,
): "USER" | "ADMIN" | "OWNER" {
  if (!role) return "USER";
  const upper = role.toUpperCase();
  if (upper === "ADMIN" || upper === "OWNER") return upper;
  return "USER";
}
