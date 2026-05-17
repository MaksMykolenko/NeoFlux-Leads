import { getTranslations } from "next-intl/server";

/**
 * Shown when Postgres / Prisma env is missing or the DB query fails on deploy.
 */
export default async function DatabaseConfigBanner({
  variant,
  detail,
}: {
  variant: "missing_env" | "query_failed";
  detail?: string | null;
}) {
  const t = await getTranslations("DatabaseConfigBanner");

  return (
    <div
      role="alert"
      className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <p className="font-semibold text-amber-900 dark:text-amber-200">
        {variant === "missing_env" ? t("missingTitle") : t("queryTitle")}
      </p>
      <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
        {t("vercelSteps")}
      </p>
      <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
        {t("schemaSteps")}
      </p>
      {variant === "query_failed" && detail && (
        <pre className="mt-3 max-h-32 overflow-auto rounded-md border border-amber-200 bg-white/60 p-2 text-xs text-amber-950/80 dark:border-amber-500/30 dark:bg-flux-card/60 dark:text-amber-200/80">
          {detail}
        </pre>
      )}
      <p className="mt-3 text-xs text-amber-800/80 dark:text-amber-300/80">
        {t("logsHint")}
      </p>
    </div>
  );
}
