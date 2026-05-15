import { getLocale } from "next-intl/server";
import { redirect } from "@/src/i18n/navigation";

export default async function AdminIndexPage() {
  redirect({ href: "/admin/users", locale: await getLocale() });
}
