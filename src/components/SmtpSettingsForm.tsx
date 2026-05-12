"use client";

import { useState, useTransition } from "react";
import { saveSmtpSettings, sendTestEmail } from "@/src/actions/userActions";

type Mode = "platform" | "custom" | "test";

interface SmtpSettingsFormProps {
  user: {
    usePlatformSmtp: boolean;
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
  const [mode, setMode] = useState<Mode>(
    user.usePlatformSmtp ? "platform" : "custom",
  );
  const [host, setHost] = useState(user.smtpHost ?? "");
  const [port, setPort] = useState(user.smtpPort?.toString() ?? "465");
  const [username, setUsername] = useState(user.smtpUser ?? "");
  const [password, setPassword] = useState(
    user.hasSmtpPass ? PASSWORD_PLACEHOLDER : "",
  );
  const [fromEmail, setFromEmail] = useState(user.fromEmail ?? "");
  const [fromName, setFromName] = useState(user.fromName ?? "");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPlatform = mode === "platform";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const result = await saveSmtpSettings({
        usePlatformSmtp: isPlatform,
        // У Простому режимі ці поля все одно ігноруються бекендом, але
        // передаємо актуальні значення стейту, щоб юзер міг переключитись
        // між режимами і не втратив попередні host/port/user/pass.
        smtpHost: host,
        smtpPort: Number(port),
        smtpUser: username,
        smtpPass: password,
        fromEmail,
        fromName,
      });

      if (result.success) {
        setStatus({
          type: "success",
          msg: isPlatform
            ? "Збережено. Тепер можна слати листи через платформу — відповіді приходитимуть на твій email."
            : "Збережено. Власний SMTP готовий до відправок.",
        });
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

  const savedMode: "platform" | "custom" = user.usePlatformSmtp
    ? "platform"
    : "custom";
  // Перелічуємо саме ЧОГО бракує — банер у TestPanel покаже список,
  // щоб юзер не вгадував, чому конфіг ще не «повний».
  const missingFields: string[] = [];
  if (!user.fromEmail) missingFields.push("From Email");
  if (savedMode === "custom") {
    if (!user.smtpHost) missingFields.push("SMTP Host");
    if (!user.smtpPort) missingFields.push("SMTP Port");
    if (!user.smtpUser) missingFields.push("SMTP Username");
    if (!user.hasSmtpPass) missingFields.push("SMTP Password");
  }

  return (
    <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-flux-border dark:bg-flux-card">
      <ModeTabs mode={mode} onChange={setMode} disabled={isPending} />

      {mode === "test" ? (
        <TestPanel
          defaultEmail={user.fromEmail ?? ""}
          missingFields={missingFields}
          savedMode={savedMode}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {isPlatform ? <PlatformBanner /> : <CustomBanner />}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Ім'я відправника"
              hint={
                isPlatform
                  ? "як підписатись в листах; показується замість email"
                  : "опційно — показується замість email"
              }
            >
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Sales Team"
                className={inputClass}
                disabled={isPending}
              />
            </Field>
            <Field
              label={isPlatform ? "Email для відповідей" : "From Email"}
              hint={
                isPlatform
                  ? "клієнти відповідатимуть саме сюди — це твій робочий інбокс"
                  : "адреса в заголовку From: твоїх листів"
              }
            >
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
          </div>

          {!isPlatform && (
            <>
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
                hint="App password або SMTP-токен. Зберігається зашифровано (AES-256-GCM)."
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder={
                    user.hasSmtpPass ? "Не міняти існуючий" : "App password..."
                  }
                  className={inputClass}
                  disabled={isPending}
                />
              </Field>
            </>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-flux-border">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Кожен лист, відправлений з Flux Leads, отримує невеликий підпис із
              посиланням на сервіс.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-flux-purple dark:shadow-[0_4px_20px_rgba(106,0,255,0.4)] dark:hover:bg-flux-purple-hover"
            >
              {isPending ? "Зберігаю..." : "Зберегти"}
            </button>
          </div>

          {status && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                status.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              }`}
            >
              {status.msg}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function ModeTabs({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Режим відправки email"
      className="inline-flex w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-flux-border dark:bg-flux-bg"
    >
      <ModeTab
        active={mode === "platform"}
        onClick={() => onChange("platform")}
        disabled={disabled}
        label="Простий режим"
        sublabel="Рекомендовано"
      />
      <ModeTab
        active={mode === "custom"}
        onClick={() => onChange("custom")}
        disabled={disabled}
        label="Розширений режим"
        sublabel="Власний SMTP"
      />
      <ModeTab
        active={mode === "test"}
        onClick={() => onChange("test")}
        disabled={disabled}
        label="Тест"
        sublabel="Надіслати лист собі"
      />
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  disabled,
  label,
  sublabel,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-md px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-flux-card dark:text-zinc-50"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      <span className="block">{label}</span>
      <span
        className={`block text-[11px] font-normal ${
          active
            ? "text-purple-600 dark:text-flux-purple-soft"
            : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {sublabel}
      </span>
    </button>
  );
}

function PlatformBanner() {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/60 px-4 py-3 text-sm dark:border-flux-purple-ring dark:bg-flux-purple-tint">
      <p className="font-semibold text-purple-900 dark:text-flux-purple-soft">
        Листи летять через сервер Flux Leads
      </p>
      <p className="mt-1 text-xs text-purple-800/90 dark:text-flux-purple-soft/85">
        Нічого не налаштовуєш — просто натискаєш Send. Всі відповіді від
        клієнтів приходитимуть тобі на email, який ти вкажеш нижче (Reply-To).
      </p>
    </div>
  );
}

function CustomBanner() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-flux-border dark:bg-flux-bg">
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
        Власний SMTP
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Підтримує будь-який SMTP — Gmail (App Password), Hostinger, SendGrid,
        Mailgun, AWS SES. Лист буде з адреси, яку ти вкажеш — на ній
        будується репутація відправника.
      </p>
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:opacity-60 dark:border-flux-border dark:bg-flux-bg dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-flux-purple dark:focus:bg-flux-card dark:focus:ring-flux-purple-ring";

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
      {hint && (
        <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">
          {hint}
        </span>
      )}
    </label>
  );
}

/**
 * Тестова відправка. Користується ЗБЕРЕЖЕНИМИ налаштуваннями юзера
 * (а не значеннями з форми вище), щоб тест відображав реальну поведінку
 * outreach-листів.
 *
 * Кнопка ЗАВЖДИ активна (окрім моменту самої відправки) — навмисно: краще
 * хай юзер натисне і отримає чітке повідомлення з сервера ("збережи
 * fromEmail" / "PLATFORM_SMTP_HOST не задано"), ніж бачить німо-disabled
 * кнопку і гадає, чому. Список відсутніх полів показуємо у банері вгорі,
 * щоб одразу було видно, що треба полагодити.
 */
function TestPanel({
  defaultEmail,
  missingFields,
  savedMode,
}: {
  defaultEmail: string;
  missingFields: string[];
  savedMode: "platform" | "custom";
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isReady = missingFields.length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", msg: "Введіть email одержувача" });
      return;
    }
    startTransition(async () => {
      const result = await sendTestEmail(trimmed);
      if (result.success) {
        setStatus({
          type: "success",
          msg: `Тестовий лист відправлено на ${trimmed}. Перевір інбокс (та Спам).`,
        });
      } else {
        let msg = result.error ?? "Не вдалося відправити тестовий лист";
        if (result.code === "NO_SMTP") {
          msg = `${msg}\n\nПерейдіть на вкладку "${savedMode === "platform" ? "Простий" : "Розширений"} режим", заповніть поля і натисніть Зберегти.`;
        } else if (result.code === "PLATFORM_NOT_CONFIGURED") {
          msg = `${msg}\n\nЦе налаштовує адмін сервера (PLATFORM_SMTP_* у .env). Або переключіться у "Розширений режим" і вкажіть свій SMTP.`;
        }
        setStatus({ type: "error", msg });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isReady ? (
        <div className="rounded-lg border border-purple-200 bg-purple-50/60 px-4 py-3 text-sm dark:border-flux-purple-ring dark:bg-flux-purple-tint">
          <p className="font-semibold text-purple-900 dark:text-flux-purple-soft">
            Тестова відправка
          </p>
          <p className="mt-1 text-xs text-purple-800/90 dark:text-flux-purple-soft/85">
            Лист піде через{" "}
            {savedMode === "platform"
              ? "платформений SMTP (як у Простому режимі)"
              : "твій власний SMTP (як у Розширеному)"}{" "}
            — те, що збережено зараз у БД. Натискай Надіслати.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="font-semibold text-amber-900 dark:text-amber-300">
            Конфіг не збережено повністю
          </p>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/85">
            Бракує:{" "}
            <span className="font-medium">{missingFields.join(", ")}</span>.
            Перейди на вкладку{" "}
            <span className="font-semibold">
              «{savedMode === "platform" ? "Простий" : "Розширений"} режим»
            </span>
            , заповни і натисни Зберегти. Кнопку нижче все одно можна натиснути
            — сервер покаже точну причину невдачі.
          </p>
        </div>
      )}

      <Field
        label="Email одержувача"
        hint="можна вказати свій email або будь-яку іншу адресу для перевірки доставки"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className={inputClass}
          disabled={isPending}
        />
      </Field>

      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-flux-border">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Тестовий лист має невеликий підпис Flux Leads — як і всі outreach-листи.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-flux-purple dark:shadow-[0_4px_20px_rgba(106,0,255,0.4)] dark:hover:bg-flux-purple-hover"
        >
          {isPending ? "Відправляю..." : "Надіслати тестовий лист"}
        </button>
      </div>

      {status && (
        <div
          className={`whitespace-pre-line rounded-lg border px-3 py-2 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {status.msg}
        </div>
      )}
    </form>
  );
}
