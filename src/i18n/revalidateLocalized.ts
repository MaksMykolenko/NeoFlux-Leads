import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

/** Revalidate a path relative to the current locale (e.g. `/settings`, `/leads/x`, `/`). */
export async function revalidateLocalizedPath(path: string): Promise<void> {
  const locale = await getLocale();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withLocale =
    normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
  revalidatePath(withLocale);
}
