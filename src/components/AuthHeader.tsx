import Link from "next/link";
import { getCurrentUser } from "@/src/lib/session";
import { getPlanForUser } from "@/src/lib/subscription";
import { isAdmin } from "@/src/lib/admin";

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

  const plan = getPlanForUser(user);
  const userIsAdmin = isAdmin(user);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 transition hover:text-gray-900"
        >
          NeoFlux Lead Engine
        </Link>

        <div className="flex items-center gap-3">
          {userIsAdmin && (
            <Link
              href="/admin/users"
              className="hidden items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 sm:inline-flex"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                  clipRule="evenodd"
                />
              </svg>
              Admin
            </Link>
          )}
          <Link
            href="/settings"
            className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:inline-flex"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
            Налаштування
          </Link>
          <Link
            href="/pricing"
            className="hidden items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 sm:inline-flex"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {plan.name}
          </Link>
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.displayName ?? user.username ?? "User"}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                {initials(user.displayName || user.username || user.email || "U")}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900 leading-tight">
                {user.displayName || user.username || "Користувач"}
              </div>
              {user.email && (
                <div className="text-xs text-gray-500 leading-tight">{user.email}</div>
              )}
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Вийти
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
