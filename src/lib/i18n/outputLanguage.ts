/** Gemini output language name from UI locale. */
export function outputLanguageFromLocale(locale: string): string {
  if (locale === "en") return "English";
  if (locale === "pl") return "Polish";
  return "Ukrainian";
}
