import { redirect } from "next/navigation";
import BrandMark from "@/src/components/BrandMark";
import { getCurrentUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Flux ID не налаштований на сервері. Адміністратор має задати змінні FLUX_*.",
  state_mismatch: "Сесія входу застаріла або підроблена. Спробуйте ще раз.",
  missing_code_or_state: "Flux ID не повернув потрібних параметрів. Спробуйте знову.",
  token_exchange_failed: "Не вдалося обміняти код на токен. Перевірте FLUX_CLIENT_SECRET.",
  userinfo_failed: "Flux ID повернув помилку при отриманні профілю. Спробуйте пізніше.",
  invalid_subject: "Flux ID повернув некоректний ідентифікатор користувача.",
  db_failure: "Не вдалося зберегти користувача в базі. Спробуйте ще раз.",
  access_denied: "Ви не дали згоду на вхід через Flux ID.",
};

function describeError(code: string | null, detail: string | null): string | null {
  if (!code) return null;
  const base = ERROR_MESSAGES[code] ?? `Помилка входу: ${code}`;
  if (detail?.trim()) {
    return ERROR_MESSAGES[code] ? `${base}\n\n${detail.trim()}` : detail.trim();
  }
  return base;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string; auth_error_detail?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const params = await searchParams;
  const errorMessage = describeError(params.auth_error ?? null, params.auth_error_detail ?? null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200/70 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <BrandMark href="/" className="h-14 w-14" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
              NeoFlux Lead Engine
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Увійдіть, щоб відкрити панель лідів та інструменти outreach.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
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
              <p className="whitespace-pre-line text-xs leading-relaxed text-red-700">
                {errorMessage}
              </p>
            </div>
          )}

          <a
            href="/api/auth/flux/login"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 active:bg-black"
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
            Увійти через Flux ID
          </a>

          <p className="mt-6 text-center text-xs text-gray-400">
            Flux ID — єдиний акаунт для всіх продуктів екосистеми Flux.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Немає акаунту?{" "}
          <a
            href="https://fluxid.fluxmarketplace.store/auth/sign-up.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-600 hover:text-gray-900 hover:underline"
          >
            Зареєструватися
          </a>
        </p>
      </div>
    </main>
  );
}
