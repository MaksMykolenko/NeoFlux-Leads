"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  saveSmtpSettings,
  sendTestEmail,
  sendTestEmailWithAttachment,
  type SendTestEmailResult,
} from "@/src/actions/userActions";

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
  const t = useTranslations("SmtpSettingsForm");
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
          msg: isPlatform ? t("successPlatform") : t("successCustom"),
        });
        if (password && password !== PASSWORD_PLACEHOLDER) {
          setPassword(PASSWORD_PLACEHOLDER);
        }
      } else {
        setStatus({
          type: "error",
          msg: result.error ?? t("errorSave"),
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
      <ModeTabs mode={mode} onChange={setMode} disabled={isPending} t={t} />

      {mode === "test" ? (
        <TestPanel
          t={t}
          defaultEmail={user.fromEmail ?? ""}
          missingFields={missingFields}
          savedMode={savedMode}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {isPlatform ? <PlatformBanner t={t} /> : <CustomBanner t={t} />}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={t("fromName")}
              hint={
                isPlatform
                  ? t("fromNameHintPlatform")
                  : t("fromNameHintCustom")
              }
            >
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder={t("fromNamePlaceholder")}
                className={inputClass}
                disabled={isPending}
              />
            </Field>
            <Field
              label={
                isPlatform
                  ? t("fromEmailLabelPlatform")
                  : t("fromEmailLabelCustom")
              }
              hint={
                isPlatform
                  ? t("fromEmailHintPlatform")
                  : t("fromEmailHintCustom")
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
              <Field label={t("host")} hint={t("hostHint")}>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder={t("hostPlaceholder")}
                  className={inputClass}
                  disabled={isPending}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("port")} hint={t("portHint")}>
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
                <Field label={t("username")} hint={t("usernameHint")}>
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

              <Field label={t("password")} hint={t("passwordHint")}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder={
                    user.hasSmtpPass
                      ? t("passwordPlaceholderExisting")
                      : t("passwordPlaceholderNew")
                  }
                  className={inputClass}
                  disabled={isPending}
                />
              </Field>
            </>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-flux-border">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("footerSignature")}
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-flux-purple dark:shadow-[0_4px_20px_rgba(106,0,255,0.4)] dark:hover:bg-flux-purple-hover"
            >
              {isPending ? t("saving") : t("save")}
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
  t,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div
      role="tablist"
      aria-label={t("tablistLabel")}
      className="inline-flex w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-flux-border dark:bg-flux-bg"
    >
      <ModeTab
        active={mode === "platform"}
        onClick={() => onChange("platform")}
        disabled={disabled}
        label={t("modePlatform")}
        sublabel={t("modePlatformSub")}
      />
      <ModeTab
        active={mode === "custom"}
        onClick={() => onChange("custom")}
        disabled={disabled}
        label={t("modeCustom")}
        sublabel={t("modeCustomSub")}
      />
      <ModeTab
        active={mode === "test"}
        onClick={() => onChange("test")}
        disabled={disabled}
        label={t("modeTest")}
        sublabel={t("modeTestSub")}
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

function PlatformBanner({
  t,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/60 px-4 py-3 text-sm dark:border-flux-purple-ring dark:bg-flux-purple-tint">
      <p className="font-semibold text-purple-900 dark:text-flux-purple-soft">
        {t("platformBannerTitle")}
      </p>
      <p className="mt-1 text-xs text-purple-800/90 dark:text-flux-purple-soft/85">
        {t("platformBannerBody")}
      </p>
    </div>
  );
}

function CustomBanner({
  t,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-flux-border dark:bg-flux-bg">
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
        {t("customBannerTitle")}
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {t("customBannerBody")}
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
  t,
  defaultEmail,
  missingFields,
  savedMode,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  defaultEmail: string;
  missingFields: string[];
  savedMode: "platform" | "custom";
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [sendKind, setSendKind] = useState<"plain" | "file" | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isReady = missingFields.length === 0;
  const modeLabel =
    savedMode === "platform" ? t("testModePlatform") : t("testModeCustom");
  const tabHint =
    savedMode === "platform" ? t("testTabSimple") : t("testTabAdvanced");

  function applySmtpHints(result: SendTestEmailResult): string {
    let msg = result.error ?? t("errors.generic");
    if (result.code === "NO_SMTP") {
      msg = `${msg}\n\n${t("testErrorNoSmtpHint", { tab: tabHint })}`;
    } else if (result.code === "PLATFORM_NOT_CONFIGURED") {
      msg = `${msg}\n\n${t("testErrorPlatformHint")}`;
    }
    return msg;
  }

  function sendPlain() {
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", msg: t("testErrorRecipient") });
      return;
    }
    setSendKind("plain");
    startTransition(async () => {
      try {
        const result = await sendTestEmail(trimmed);
        if (result.success) {
          setStatus({
            type: "success",
            msg: t("testSuccess", { email: trimmed }),
          });
        } else {
          setStatus({ type: "error", msg: applySmtpHints(result) });
        }
      } finally {
        setSendKind(null);
      }
    });
  }

  function sendWithAttachment() {
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", msg: t("testErrorRecipient") });
      return;
    }
    if (!attachmentFile) {
      setStatus({
        type: "error",
        msg: t("testErrorPickFile"),
      });
      return;
    }
    setSendKind("file");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("to", trimmed);
        fd.append("audio", attachmentFile);
        const result = await sendTestEmailWithAttachment(fd);
        if (result.success) {
          setStatus({
            type: "success",
            msg: t("testSuccessWithFile", { email: trimmed }),
          });
        } else {
          setStatus({ type: "error", msg: applySmtpHints(result) });
        }
      } finally {
        setSendKind(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {isReady ? (
        <div className="rounded-lg border border-purple-200 bg-purple-50/60 px-4 py-3 text-sm dark:border-flux-purple-ring dark:bg-flux-purple-tint">
          <p className="font-semibold text-purple-900 dark:text-flux-purple-soft">
            {t("testReadyTitle")}
          </p>
          <p className="mt-1 text-xs text-purple-800/90 dark:text-flux-purple-soft/85">
            {t("testReadyBody", { mode: modeLabel })}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="font-semibold text-amber-900 dark:text-amber-300">
            {t("testIncompleteTitle")}
          </p>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/85">
            {t("testIncompleteBody", {
              missing: missingFields.join(", "),
              tab: tabHint,
            })}
          </p>
        </div>
      )}

      <Field label={t("testRecipientLabel")} hint={t("testRecipientHint")}>
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

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-flux-border dark:bg-flux-bg/80">
        <Field label={t("testAttachmentLabel")} hint={t("testAttachmentHint")}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
              className={`${inputClass} py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-purple-800 dark:file:bg-purple-500/20 dark:file:text-purple-200`}
              disabled={isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setAttachmentFile(f ?? null);
              }}
            />
            {attachmentFile && (
              <button
                type="button"
                onClick={() => setAttachmentFile(null)}
                className="text-xs font-medium text-zinc-500 underline hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {t("testAttachmentClear")}
              </button>
            )}
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-flux-border sm:flex-row sm:items-end sm:justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("testFooterNote")}
        </p>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={sendPlain}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {isPending && sendKind === "plain"
              ? t("testSubmitPending")
              : t("testSubmit")}
          </button>
          <button
            type="button"
            onClick={sendWithAttachment}
            disabled={isPending || !attachmentFile}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
          >
            {isPending && sendKind === "file"
              ? t("testSubmitWithFilePending")
              : t("testSubmitWithFile")}
          </button>
        </div>
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
    </div>
  );
}
