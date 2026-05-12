import { getTranslations } from "next-intl/server";
import { redirect } from "@/src/i18n/navigation";
import BrandMark from "@/src/components/BrandMark";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import { getCurrentUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ auth_error?: string; auth_error_detail?: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (user) redirect({ href: "/", locale });

  const t = await getTranslations({ locale, namespace: "Login" });
  const paramsSearch = await searchParams;
  const code = paramsSearch.auth_error ?? null;
  const detail = paramsSearch.auth_error_detail ?? null;

  const errorMessage = formatLoginError(t, code, detail);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-cyan-50 px-4 py-12 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-md bg-white p-8 shadow-lg ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <BrandMark href="/" className="h-14 w-14" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>

          {errorMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="whitespace-pre-line text-xs leading-relaxed text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Link to a Route Handler (not a page) — `next/link` would prefetch
              and break the OAuth flow. eslint rule doesn't know about that. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/flux/login"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-cyan-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 003 3h2a3 3 0 003-3V7a3 3 0 00-3-3h-2a3 3 0 00-3 3v1"
              />
            </svg>
            {t("fluxCta")}
          </a>

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {t("fluxFooter")}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {t("noAccount")}{" "}
          <a
            href="https://fluxid.fluxmarketplace.store/auth/sign-up.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {t("register")}
          </a>
        </p>
      </div>
    </main>
  );
}

type LoginT = Awaited<ReturnType<typeof getTranslations>>;

function formatLoginError(
  t: LoginT,
  code: string | null,
  detail: string | null,
): string | null {
  if (!code) return null;
  let base: string;
  switch (code) {
    case "not_configured":
      base = t("errors.not_configured");
      break;
    case "state_mismatch":
      base = t("errors.state_mismatch");
      break;
    case "missing_code_or_state":
      base = t("errors.missing_code_or_state");
      break;
    case "token_exchange_failed":
      base = t("errors.token_exchange_failed");
      break;
    case "userinfo_failed":
      base = t("errors.userinfo_failed");
      break;
    case "invalid_subject":
      base = t("errors.invalid_subject");
      break;
    case "db_failure":
      base = t("errors.db_failure");
      break;
    case "access_denied":
      base = t("errors.access_denied");
      break;
    default:
      base = t("errors.fallback", { code });
  }
  if (detail?.trim()) {
    return `${base}\n\n${detail.trim()}`;
  }
  return base;
}
