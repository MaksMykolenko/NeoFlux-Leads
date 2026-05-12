import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { requireAdmin, normalizeRole } from "@/src/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const role = normalizeRole(user.role);
  const t = await getTranslations("AdminLayout");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-flux-card">
      <div className="border-b border-zinc-200 bg-white dark:border-flux-border dark:bg-flux-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
              {t("backToWorkspace")}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("centerTitle")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("navUsers")}
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                role === "OWNER"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {role}
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
