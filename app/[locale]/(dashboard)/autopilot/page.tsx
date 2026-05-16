import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { requireUser } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import AutopilotConfigForm from "@/src/components/AutopilotConfigForm";

export const dynamic = "force-dynamic";

export default async function AutopilotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Autopilot");

  const user = await requireUser();

  const [configs, telegram] = await Promise.all([
    prisma.autopilotConfig.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        mode: true,
        searchQuery: true,
        targetRegion: true,
        outputLanguage: true,
        channels: true,
        maxLeadsPerDay: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.telegramSession.findUnique({
      where: { userId: user.id },
      select: { isActive: true },
    }),
  ]);

  const telegramReady = !!telegram?.isActive;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-flux-bg">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-flux-muted dark:hover:text-flux-text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clipRule="evenodd"
            />
          </svg>
          {t("back")}
        </Link>

        <header className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-flux-text">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-flux-muted">
            {t("subtitle")}
          </p>
        </header>

        {!telegramReady && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {t.rich("telegramHint", {
              link: (chunks) => (
                <Link
                  href="/settings"
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </div>
        )}

        <div className="mt-8">
          <AutopilotConfigForm
            initialConfigs={configs}
            telegramReady={telegramReady}
          />
        </div>
      </div>
    </main>
  );
}
