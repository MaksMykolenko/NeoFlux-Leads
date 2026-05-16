import "server-only";
import type { NextRequest } from "next/server";

/**
 * Перевіряє, що запит прийшов від Vercel Cron (або іншого довіреного джерела).
 * Vercel автоматично додає header `Authorization: Bearer <CRON_SECRET>` при
 * виконанні розкладу з vercel.json.
 *
 * Повертає null, якщо все ОК; інакше — Response 401, який роут одразу віддає.
 */
export function assertCronAuth(req: NextRequest): Response | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
