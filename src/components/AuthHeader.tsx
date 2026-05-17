import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { getCurrentUser } from "@/src/lib/session";
import { getPlanForUser } from "@/src/lib/subscription";
import { isAdmin } from "@/src/lib/admin";
import BrandMark from "@/src/components/BrandMark";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import ThemeToggle from "@/src/components/ThemeToggle";

/**
 * Хедер після авторизації. Структура:
 *
 *   [Logo · Flux Leads]                       [Lang] [Admin?] [Plan] | [Avatar Name] [⚙] [↗]
 *      ─── ліва зона ───                      ────────── права (actions + profile) ──────────
 *
 * Усі кнопки висотою 32px (h-8). На мобільному: ховаємо текст brand-у
 * (тільки логотип), Plan-pill, name+email — лишаємо аватар і дії-іконки.
 * Settings та Logout — icon-only square buttons із tooltip; на ≥sm
 * Logout ще показує текст. Без жодних glow/градієнтів.
 */
export default async function AuthHeader() {
  const user = await getCurrentUser();
  if (!user) return null;

  const t = await getTranslations("AuthHeader");
  const plan = getPlanForUser(user);
  const userIsAdmin = isAdmin(user);
  const displayName = user.displayName || user.username || t("fallbackUser");

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-flux-border dark:bg-flux-bg/80 dark:supports-[backdrop-filter]:bg-flux-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* ─── Brand ─── */}
        <Link
          href="/dashboard"
          className="group flex flex-shrink-0 items-center gap-3 rounded-md py-1 text-zinc-900 transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple dark:text-flux-text"
        >
          <BrandMark href="/dashboard" className="h-9 w-9" />
          <span className="hidden whitespace-nowrap text-base font-bold tracking-tight sm:inline">
            {t("productName")}
          </span>
        </Link>

        {/* ─── Actions + profile ─── */}
        <div className="flex min-w-0 items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          <Link
            href="/autopilot"
            title={t("autopilot")}
            aria-label={t("autopilot")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple dark:text-flux-text dark:hover:bg-flux-card dark:hover:text-white"
          >
            <AutopilotIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("autopilot")}</span>
          </Link>

          {/* Flux Promote moved into ModeTabs (see /dashboard) for admins —
              keeps the header lean and groups all "modes" in one place. */}

          {userIsAdmin && (
            <Link
              href="/admin/users"
              title={t("admin")}
              aria-label={t("admin")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-50 px-2.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition-all duration-200 hover:bg-amber-100 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 dark:hover:bg-amber-500/20"
            >
              <LockIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("admin")}</span>
            </Link>
          )}

          <Link
            href="/pricing"
            title={plan.name}
            className="hidden h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:border-flux-purple/40 dark:hover:bg-flux-purple-tint dark:hover:text-flux-purple-soft md:inline-flex"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-flux-purple" />
            {plan.name}
          </Link>

          <span className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-flux-border-strong md:inline-block" />

          {/* Profile — клік → /settings (швидкий шлях до налаштувань SMTP) */}
          <Link
            href="/settings"
            title={t("openProfile")}
            className="group flex min-w-0 items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-left transition-all duration-200 hover:bg-zinc-100 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple dark:hover:bg-flux-card"
          >
            <Avatar user={user} fallback={displayName} />
            <div className="hidden min-w-0 lg:block">
              <div className="truncate text-sm font-medium leading-tight text-zinc-900 dark:text-flux-text">
                {displayName}
              </div>
              {user.email && (
                <div className="truncate text-[11px] leading-tight text-zinc-500 dark:text-flux-muted">
                  {user.email}
                </div>
              )}
            </div>
          </Link>

          <Link
            href="/settings"
            title={t("settings")}
            aria-label={t("settings")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple dark:text-flux-muted dark:hover:bg-flux-card dark:hover:text-flux-text"
          >
            <GearIcon className="h-4 w-4" />
          </Link>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title={t("signOut")}
              aria-label={t("signOut")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:text-flux-muted dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:px-3 sm:text-zinc-700 sm:dark:text-zinc-300"
            >
              <LogoutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function Avatar({
  user,
  fallback,
}: {
  user: {
    avatarUrl: string | null;
    email: string | null;
  };
  fallback: string;
}) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-semibold uppercase text-purple-700 ring-1 ring-purple-200 dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:ring-flux-purple-ring">
      {initials(fallback || user.email || "U")}
    </div>
  );
}

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function AutopilotIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1.5a.75.75 0 0 1 .75.75v1.06a6.502 6.502 0 0 1 5.94 5.94h1.06a.75.75 0 0 1 0 1.5h-1.06a6.502 6.502 0 0 1-5.94 5.94v1.06a.75.75 0 0 1-1.5 0v-1.06A6.502 6.502 0 0 1 3.31 10.75H2.25a.75.75 0 0 1 0-1.5h1.06A6.502 6.502 0 0 1 9.25 3.31V2.25A.75.75 0 0 1 10 1.5Zm0 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GearIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LogoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M19 10a.75.75 0 0 0-.22-.53l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.75a.75.75 0 0 0 0 1.5h7.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3A.75.75 0 0 0 19 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
