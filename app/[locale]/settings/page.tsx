import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { requireUser } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import SmtpSettingsForm from "@/src/components/SmtpSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Settings");

  const user = await requireUser();

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPass: true,
      fromEmail: true,
      fromName: true,
    },
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("smtpSectionTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("smtpSectionSubtitle")}</p>
          </div>
          <SmtpSettingsForm
            user={{
              smtpHost: fresh?.smtpHost ?? null,
              smtpPort: fresh?.smtpPort ?? null,
              smtpUser: fresh?.smtpUser ?? null,
              hasSmtpPass: !!fresh?.smtpPass,
              fromEmail: fresh?.fromEmail ?? null,
              fromName: fresh?.fromName ?? null,
            }}
          />
        </section>
      </div>
    </main>
  );
}
