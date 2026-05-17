import { getLocale } from "next-intl/server";
import type { User } from "@prisma/client";
import { redirect } from "@/src/i18n/navigation";
import { getCurrentUser, requireUser } from "@/src/lib/session";
import { canUseFluxPromote } from "@/src/lib/promotion/access";

export async function requireFluxPromoteUser(): Promise<User> {
  const user = await requireUser();
  if (!canUseFluxPromote(user)) {
    redirect({ href: "/dashboard", locale: await getLocale() });
  }
  return user;
}

export type FluxPromoteActionAccess =
  | { ok: true; user: User }
  | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN"; status: 401 | 403 };

export async function checkFluxPromoteActionAccess(): Promise<FluxPromoteActionAccess> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED", status: 401 };
  if (!canUseFluxPromote(user)) {
    return { ok: false, error: "FORBIDDEN", status: 403 };
  }
  return { ok: true, user };
}
