import { getCurrentUser } from "@/src/lib/session";

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

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <span className="text-sm font-medium text-gray-700">NeoFlux Lead Engine</span>

        {user ? (
          <div className="flex items-center gap-3">
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
        ) : (
          <a
            href="/api/auth/flux/login"
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-gray-800"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4m6-12h6a2 2 0 012 2v12a2 2 0 01-2 2h-6" />
            </svg>
            Увійти через Flux ID
          </a>
        )}
      </div>
    </header>
  );
}
