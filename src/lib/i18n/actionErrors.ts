import { getLocale, getTranslations } from "next-intl/server";

type ActionErrorValues = Record<string, string | number | Date>;

export async function actionError(
  key: string,
  values?: ActionErrorValues,
): Promise<string> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "ActionErrors" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return t(key as any, values as any);
}
