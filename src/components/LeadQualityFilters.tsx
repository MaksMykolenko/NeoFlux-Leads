import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { LEAD_FILTERS, type LeadFilter } from "@/src/lib/leadFilters";

type Props = {
  active: LeadFilter[];
  mode: string;
};

export default async function LeadQualityFilters({ active, mode }: Props) {
  const t = await getTranslations("LeadFilters");
  const activeSet = new Set(active);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-flux-border dark:bg-flux-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        {active.length > 0 && (
          <Link
            href={`/dashboard?mode=${mode}`}
            className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:underline dark:text-flux-purple-soft dark:hover:text-white"
          >
            {t("clear")}
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEAD_FILTERS.map((filter) => {
          const selected = activeSet.has(filter);
          const next = selected
            ? active.filter((item) => item !== filter)
            : [...active, filter];
          const href =
            next.length === 0
              ? `/dashboard?mode=${mode}`
              : `/dashboard?mode=${mode}&filter=${next.join(",")}`;

          return (
            <Link
              key={filter}
              href={href}
              className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors ${
                selected
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:border-flux-purple dark:bg-flux-purple/15 dark:text-flux-purple-soft"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-300 dark:hover:border-flux-border-strong"
              }`}
            >
              {t(`items.${filter}`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
