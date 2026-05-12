"use client";

import { useState, useTransition } from "react";
import { saveSmtpSettings } from "@/src/actions/userActions";

interface SmtpSettingsFormProps {
  user: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    hasSmtpPass: boolean;
    fromEmail: string | null;
    fromName: string | null;
  };
}

const PASSWORD_PLACEHOLDER = "••••••••";

export default function SmtpSettingsForm({ user }: SmtpSettingsFormProps) {
  const [host, setHost] = useState(user.smtpHost ?? "");
  const [port, setPort] = useState(user.smtpPort?.toString() ?? "465");
  const [username, setUsername] = useState(user.smtpUser ?? "");
  const [password, setPassword] = useState(
    user.hasSmtpPass ? PASSWORD_PLACEHOLDER : "",
  );
  const [fromEmail, setFromEmail] = useState(user.fromEmail ?? "");
  const [fromName, setFromName] = useState(user.fromName ?? "");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const result = await saveSmtpSettings({
        smtpHost: host,
        smtpPort: Number(port),
        smtpUser: username,
        smtpPass: password,
        fromEmail,
        fromName,
      });

      if (result.success) {
        setStatus({ type: "success", msg: "Збережено. SMTP готовий до відправок." });
        if (password && password !== PASSWORD_PLACEHOLDER) {
          setPassword(PASSWORD_PLACEHOLDER);
        }
      } else {
        setStatus({
          type: "error",
          msg: result.error ?? "Не вдалось зберегти налаштування",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Field
        label="Host"
        hint="напр. smtp.gmail.com або smtp.hostinger.com"
      >
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          required
          autoComplete="off"
          placeholder="smtp.example.com"
          className={inputClass}
          disabled={isPending}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Port" hint="465 для SSL, 587 для STARTTLS">
          <input
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(e.target.value)}
            required
            className={inputClass}
            disabled={isPending}
          />
        </Field>
        <Field label="Username" hint="зазвичай — твій email">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            className={inputClass}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field
        label="Password"
        hint="App password або SMTP-токен. Зберігається в БД у відкритому вигляді — не використовуй пароль свого основного акаунту."
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={user.hasSmtpPass ? "Не міняти існуючий" : "App password..."}
          className={inputClass}
          disabled={isPending}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="From Email">
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className={inputClass}
            disabled={isPending}
          />
        </Field>
        <Field label="From Name" hint="опційно">
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Maks Mykolenko"
            className={inputClass}
            disabled={isPending}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Кожен лист, відправлений з NeoFlux, отримує невеликий підпис із
          посиланням на сервіс.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {isPending ? "Зберігаю..." : "Зберегти"}
        </button>
      </div>

      {status && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.msg}
        </div>
      )}
    </form>
  );
}

const inputClass =
  "block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:opacity-60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">{hint}</span>}
    </label>
  );
}
