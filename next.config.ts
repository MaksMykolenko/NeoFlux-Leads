import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "telegram"],
  experimental: {
    // BEATS-флоу шле MP3-демо як FormData у `sendBeatViaEmail`. Дефолтний
    // ліміт у 1MB для Server Actions ріже навіть короткі біти; 15MB вистачає
    // для типового 3-5 хвилинного треку при 192-320kbps з запасом на FormData
    // overhead. Якщо колись треба буде слати >15MB — кращим рішенням буде
    // direct upload у S3-сумісне сховище і пересилання лише посилання.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default withNextIntl(nextConfig);
