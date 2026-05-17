import { hasLocale } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  let messages: AbstractIntlMessages;
  if (locale === "en") {
    messages = (await import("@/src/messages/en")).default;
  } else if (locale === "pl") {
    messages = (await import("@/src/messages/pl")).default;
  } else {
    messages = (await import("@/src/messages/uk")).default;
  }

  return {
    locale,
    messages,
  };
});
