import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { getCurrentUser } from "@/src/lib/session";
import { getPlanForUser } from "@/src/lib/subscription";
import { isAdmin } from "@/src/lib/admin";
import BrandMark from "@/src/components/BrandMark";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default async function AuthHeader() {
  const user = await getCurrentUser();

  // Не залогінений → хедера взагалі нема. Гостей middleware вже завертає на
  // /login, де є власна welcome-сторінка з кнопкою входу. Хедер з кнопкою
  // тут був би дублюванням і ламав би UX логін-сторінки.
  if (!user) return null;

  const t = await getTranslations("AuthHeader");
  const plan = getPlanForUser(user);
  const userIsAdmin = isAdmin(user);
  const displayName = user.displayName || user.username || t("fallbackUser");

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2 text-gray-900 transition hover:opacity-80"
        >
          <BrandMark className="h-7 w-7" />
          <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight sm:inline">
            {t("productName")}
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-1">
          <LanguageSwitcher />

          {userIsAdmin && (
            <Link
              href="/admin/users"
              title={t("admin")}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
            >
              <LockIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("admin")}</span>
            </Link>
          )}

          <Link
            href="/settings"
            title={t("settings")}
            aria-label={t("settings")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <GearIcon className="h-4 w-4" />
          </Link>

          <Link
            href="/pricing"
            title={plan.name}
            className="hidden items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 md:inline-flex"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {plan.name}
          </Link>

          <span className="mx-1 hidden h-5 w-px bg-gray-200 md:inline-block" />

          <div className="flex min-w-0 items-center gap-2 pl-1">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
              />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                {initials(displayName || user.email || "U")}
              </div>
            )}
            <div className="hidden min-w-0 lg:block">
              <div className="truncate text-sm font-medium leading-tight text-gray-900">
                {displayName}
              </div>
              {user.email && (
                <div className="truncate text-xs leading-tight text-gray-500">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          <form action="/api/auth/logout" method="post" className="ml-1">
            <button
              type="submit"
              title={t("signOut")}
              aria-label={t("signOut")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:font-medium sm:text-gray-700 sm:hover:bg-gray-50 sm:hover:text-gray-900"
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
