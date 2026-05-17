/**
 * Pathnames without locale prefix — used by proxy auth whitelist and sitemap.
 */
export const PUBLIC_PATHNAMES = [
  "/",
  "/pricing",
  "/solutions/web-agencies",
  "/solutions/agencje-webowe",
  "/login",
  "/privacy",
  "/terms",
  "/cookies",
  "/acceptable-use",
  "/lead-generation-for-web-design-agencies",
  "/find-web-design-clients",
  "/local-business-website-audit-tool",
  "/cold-email-for-web-agencies",
  "/pozyskiwanie-klientow-dla-agencji-webowych",
  "/jak-znalezc-klientow-na-strony-internetowe",
] as const;

export type PublicPathname = (typeof PUBLIC_PATHNAMES)[number];

export function stripLocalePrefix(pathname: string): string {
  for (const loc of ["uk", "en", "pl"] as const) {
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
];

export const LOCALIZED_SITEMAP_PATHNAMES = [
  { locale: "uk", pathname: "/solutions/web-agencies" },
  { locale: "en", pathname: "/solutions/web-agencies" },
  { locale: "pl", pathname: "/solutions/agencje-webowe" },
  { locale: "en", pathname: "/lead-generation-for-web-design-agencies" },
  { locale: "en", pathname: "/find-web-design-clients" },
  { locale: "en", pathname: "/local-business-website-audit-tool" },
  { locale: "en", pathname: "/cold-email-for-web-agencies" },
  { locale: "pl", pathname: "/pozyskiwanie-klientow-dla-agencji-webowych" },
  { locale: "pl", pathname: "/jak-znalezc-klientow-na-strony-internetowe" },
] as const;
