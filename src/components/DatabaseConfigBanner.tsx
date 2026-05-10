/**
 * Shown when Postgres / Prisma env is missing or the DB query fails on deploy.
 * Avoids a generic Vercel 500 with no hints for the project owner.
 */
export default function DatabaseConfigBanner({
  variant,
  detail,
}: {
  variant: "missing_env" | "query_failed";
  detail?: string | null;
}) {
  return (
    <div
      role="alert"
      className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm"
    >
      <p className="font-semibold text-amber-900">
        {variant === "missing_env"
          ? "База даних не підключена на цьому середовищі"
          : "Не вдалося зчитати ліди з бази"}
      </p>
      <p className="mt-2 text-amber-900/90">
        Для Vercel відкрийте{" "}
        <strong>Project → Settings → Environment Variables</strong> і додайте
        обовʼязково{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
          DATABASE_URL
        </code>{" "}
        та{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
          DIRECT_URL
        </code>{" "}
        (як у локальному <code className="text-xs">.env</code> / Supabase).
        Потім зробіть <strong>Redeploy</strong>.
      </p>
      <p className="mt-2 text-amber-900/90">
        Одноразово застосуйте схему до продакшен-БД:{" "}
        <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
          npx prisma db push
        </code>{" "}
        з <code className="text-xs">DATABASE_URL</code> на прод.
      </p>
      {variant === "query_failed" && detail && (
        <pre className="mt-3 max-h-32 overflow-auto rounded-md border border-amber-200 bg-white/60 p-2 text-xs text-amber-950/80">
          {detail}
        </pre>
      )}
      <p className="mt-3 text-xs text-amber-800/80">
        Детальні логи: Vercel → Deployments → виберіть деплой →{" "}
        <strong>Runtime Logs</strong> / <strong>Functions</strong>.
      </p>
    </div>
  );
}
