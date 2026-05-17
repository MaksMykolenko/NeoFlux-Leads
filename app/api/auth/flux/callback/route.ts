import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import {
  exchangeCodeForToken,
  fetchUserInfo,
  getFluxConfig,
  verifyState,
  type FluxUserInfo,
} from "@/src/lib/fluxAuth";
import { prisma } from "@/src/lib/prisma";
import { routing } from "@/src/i18n/routing";
import { buildSessionCookie, createSession } from "@/src/lib/session";
import { inferRoleForEmail, normalizeRole, type Role } from "@/src/lib/admin";
import { getPublicAppOrigin } from "@/src/lib/siteOrigin";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "neoflux_oauth_state";

const TRANSIENT_DB_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Connection timeout
  "P1017", // Server closed the connection
  "P2024", // Timed out fetching connection from pool
]);

function isTransientUserDbError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_DB_CODES.has(err.code);
  }
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return (
      m.includes("max clients") ||
      m.includes("emaxconnsession") ||
      m.includes("econnreset")
    );
  }
  return false;
}

function dbFailureDetail(err: unknown): string | undefined {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") {
      return "У цій базі ще немає таблиць User/Session. Застосуйте схему Prisma до тієї ж БД, що в DATABASE_URL (локально: npx prisma db push; прод: migrate deploy або db push), потім спробуйте вхід знову.";
    }
    if (err.code === "P2022") {
      // Schema drift: Prisma client знає колонку, якої немає у БД.
      // Найчастіше — забули запустити міграцію після зміни schema.prisma
      // (наприклад додавання usePlatformSmtp у модель User).
      const col =
        (err.meta as { column?: string } | undefined)?.column ?? "невідома";
      return `У БД відсутня колонка "${col}", яку очікує Prisma. Це означає, що schema.prisma був оновлений, але міграцію до цієї бази ще не застосували. Виконайте:\n  npx prisma db push    # dev, без файлу-міграції\nабо:\n  npx prisma migrate deploy   # prod, із файлами prisma/migrations`;
    }
    if (err.code === "P2002") {
      return "Конфлікт унікальності (частіше всього email уже прив’язаний до іншого fluxUserId). Перевірте таблицю User у БД або зверніться до адміністратора.";
    }
    if (TRANSIENT_DB_CODES.has(err.code)) {
      return "Тимчасова проблема з’єднання з базою (таймаут або зайнятий пул з’єднань). Спробуйте вхід ще раз за хвилину; якщо повторюється часто — перевірте Supabase pooler / ліміти та DATABASE_URL.";
    }
  }
  // Prisma іноді кидає валідаційну помилку (unknown arg, відсутнє поле тощо) —
  // це теж зазвичай схема-дрейф або застарілий @prisma/client. Покажемо хінт.
  if (err instanceof Prisma.PrismaClientValidationError) {
    return "Prisma-валідація не пропустила запит (ймовірно schema.prisma і @prisma/client розсинхронізовані). Запустіть `npx prisma generate`, потім `npx prisma db push`.";
  }
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("max clients") || m.includes("emaxconnsession")) {
      return "База відхилила з’єднання: ліміт клієнтів на pooler (часто Supabase session mode). Спробуйте ще раз; для Prisma migrate використовуйте DIRECT_URL на прямий хост db.*.supabase.co.";
    }
    // Сирий Postgres-текст від драйвера, коли він проривається без обгортки Prisma.
    if (m.includes("column") && m.includes("does not exist")) {
      return "Postgres повідомив, що очікуваної колонки немає у БД (schema drift). Виконайте `npx prisma db push` до тієї ж бази, що у DATABASE_URL.";
    }
  }
  return undefined;
}

/**
 * Upsert користувача з Flux userinfo. Повторює спробу при типових тимчасових
 * збоях з’єднання з Postgres (pooler Supabase, таймаути).
 */
async function upsertUserFromFluxProfile(params: {
  fluxUserId: number;
  userInfo: FluxUserInfo;
  initialRole: Role;
}): Promise<User> {
  const { fluxUserId, userInfo, initialRole } = params;
  const maxAttempts = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const existing = await prisma.user.findUnique({
        where: { fluxUserId },
        select: { id: true, role: true },
      });

      if (existing) {
        const currentRole = normalizeRole(existing.role);
        const desiredRole =
          initialRole === "OWNER" ? "OWNER" : currentRole;

        return await prisma.user.update({
          where: { id: existing.id },
          data: {
            email: userInfo.email ?? null,
            username: userInfo.username ?? null,
            displayName: userInfo.display_name ?? null,
            avatarUrl: userInfo.avatar ?? null,
            role: desiredRole,
            accountType: userInfo.account_type ?? null,
          },
        });
      }

      return await prisma.user.create({
        data: {
          fluxUserId,
          email: userInfo.email ?? null,
          username: userInfo.username ?? null,
          displayName: userInfo.display_name ?? null,
          avatarUrl: userInfo.avatar ?? null,
          role: initialRole,
          accountType: userInfo.account_type ?? null,
        },
      });
    } catch (err) {
      lastErr = err;
      const retry = attempt < maxAttempts && isTransientUserDbError(err);
      if (retry) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}

function errorRedirect(req: NextRequest, code: string, detail?: string): NextResponse {
  const url = new URL(`/${routing.defaultLocale}/login`, getPublicAppOrigin(req));
  url.searchParams.set("auth_error", code);
  if (detail) url.searchParams.set("auth_error_detail", detail);
  const res = NextResponse.redirect(url, 302);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/flux" });
  return res;
}

export async function GET(req: NextRequest) {
  const status = getFluxConfig();
  if (!status.ok) {
    return errorRedirect(req, "not_configured", status.missing.join(","));
  }
  const config = status.config;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return errorRedirect(req, oauthError, url.searchParams.get("error_description") ?? undefined);
  }
  if (!code || !state) {
    return errorRedirect(req, "missing_code_or_state");
  }

  const signedStateCookie = req.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!signedStateCookie || !verifyState(signedStateCookie, state, config.oauthStateSecret)) {
    return errorRedirect(req, "state_mismatch");
  }

  let token;
  try {
    token = await exchangeCodeForToken(config, code);
  } catch (err) {
    console.error("[flux callback] token exchange", err);
    return errorRedirect(req, "token_exchange_failed");
  }

  let userInfo;
  try {
    userInfo = await fetchUserInfo(config, token.access_token);
  } catch (err) {
    console.error("[flux callback] userinfo", err);
    return errorRedirect(req, "userinfo_failed");
  }

  const fluxUserId = Number(userInfo.sub);
  if (!Number.isFinite(fluxUserId) || fluxUserId <= 0) {
    return errorRedirect(req, "invalid_subject");
  }

  // Роль на ПЕРШОМУ вході: якщо email = OWNER_EMAIL → OWNER, інакше USER
  // (Flux ID повертає `role` всередині своєї системи, але у нас власна
  // ієрархія, тож не довіряємо їй для bootstrap-y).
  // На наступних входах роль НЕ перезаписуємо — інакше промоушн до ADMIN,
  // зроблений у /admin/users, скидався б при кожному логіні.
  const initialRole = inferRoleForEmail(userInfo.email ?? null);

  let user: User;
  try {
    user = await upsertUserFromFluxProfile({
      fluxUserId,
      userInfo,
      initialRole,
    });
  } catch (err) {
    console.error("[flux callback] user upsert", err);
    return errorRedirect(req, "db_failure", dbFailureDetail(err));
  }

  const userAgent = req.headers.get("user-agent");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");

  const { token: sessionToken } = await createSession({
    userId: user.id,
    userAgent,
    ip,
  });

  const localeCookie = req.cookies.get("neoflux_oauth_locale")?.value;
  const locale =
    localeCookie &&
    (routing.locales as readonly string[]).includes(localeCookie)
      ? localeCookie
      : routing.defaultLocale;
  const home = new URL(`/${locale}/dashboard`, getPublicAppOrigin(req));
  const response = NextResponse.redirect(home, 302);

  const cookie = buildSessionCookie(sessionToken);
  response.cookies.set(cookie);
  response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/flux" });
  response.cookies.delete({ name: "neoflux_oauth_locale", path: "/api/auth/flux" });

  return response;
}
