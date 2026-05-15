/**
 * Pathnames without locale prefix — used by proxy auth whitelist and sitemap.
 */
export const PUBLIC_PATHNAMES = [
  "/",
  "/pricing",
  "/solutions/web-agencies",
  "/login",
] as const;

export type PublicPathname = (typeof PUBLIC_PATHNAMES)[number];

export function stripLocalePrefix(pathname: string): string {
  for (const loc of ["uk", "en"] as const) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) {
      const rest = pathname.slice(loc.length + 1);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }
  return pathname;
}

export function isPublicPathname(stripped: string): boolean {
  if (stripped === "/login" || stripped.startsWith("/login?")) return true;
  return PUBLIC_PATHNAMES.some(
    (p) => stripped === p || (p !== "/" && stripped.startsWith(`${p}/`)),
  );
}

/** Marketing routes indexed in sitemap (no /login). */
export const SITEMAP_PATHNAMES: PublicPathname[] = [
  "/",
  "/pricing",
  "/solutions/web-agencies",
];
