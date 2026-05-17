"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  confirmTelegramAuth,
  disconnectTelegramSession,
  saveTelegramApiCredentials,
  startTelegramAuth,
} from "@/src/actions/telegramActions";

interface InitialStatus {
  hasCredentials: boolean;
  connected: boolean;
  apiId: number | null;
  phone: string | null;
  dailyCount: number;
  isActive: boolean;
}

type AuthStep = "idle" | "code" | "password";

interface PendingAuth {
  phone: string;
  phoneCodeHash: string;
}

export default function TelegramAuthCard({
  initial,
}: {
  initial: InitialStatus;
}) {
  const t = useTranslations("TelegramAuth");
  const [status, setStatus] = useState<InitialStatus>(initial);
  const [step, setStep] = useState<AuthStep>("idle");
  const [pending, setPending] = useState<PendingAuth | null>(null);
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [showInstructions, setShowInstructions] = useState(
    !initial.hasCredentials,
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  function onSaveCreds() {
    if (!apiIdInput.trim() || !apiHashInput.trim()) {
      setError(t("errCredsRequired"));
      return;
    }
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await saveTelegramApiCredentials(apiIdInput, apiHashInput);
      if (!res.success) {
        if (res.errorCode === "INVALID_API_ID") setError(t("errInvalidApiId"));
        else if (res.errorCode === "INVALID_API_HASH")
          setError(t("errInvalidApiHash"));
        else setError(res.error ?? t("errCredsSaveFailed"));
        return;
      }
      setStatus((prev) => ({
        ...prev,
        hasCredentials: true,
        apiId: Number.parseInt(apiIdInput.trim(), 10),
      }));
      setApiIdInput("");
      setApiHashInput("");
      setShowInstructions(false);
      setInfo(t("infoCredsSaved"));
    });
  }

  function onSendCode() {
    if (!phone.trim()) {
      setError(t("errPhoneRequired"));
      return;
    }
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await startTelegramAuth(phone);
      if (!res.success || !res.phoneCodeHash || !res.phone) {
        if (res.errorCode === "NO_CREDENTIALS")
          setError(t("errNoCredentials"));
        else setError(res.error ?? t("errStartFailed"));
        return;
      }
      setPending({ phone: res.phone, phoneCodeHash: res.phoneCodeHash });
      setStep("code");
      setInfo(t("infoCodeSent"));
    });
  }

  function onVerifyCode() {
    if (!pending) return;
    if (!code.trim()) {
      setError(t("errCodeRequired"));
      return;
    }
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await confirmTelegramAuth(
        pending.phone,
        pending.phoneCodeHash,
        code,
      );
      if (res.success) {
        setStatus((prev) => ({
          ...prev,
          connected: true,
          phone: pending.phone,
          dailyCount: 0,
          isActive: true,
        }));
        setStep("idle");
        setPending(null);
        setCode("");
        setPassword("");
        setPhone("");
        setInfo(t("infoConnected"));
        return;
      }
      if (res.needsPassword || res.errorCode === "PASSWORD_REQUIRED") {
        setStep("password");
        setInfo(t("infoNeedsPassword"));
        return;
      }
      if (res.errorCode === "NO_CREDENTIALS") {
        setError(t("errCredsNotFound"));
        return;
      }
      setError(res.error ?? t("errVerifyFailed"));
    });
  }

  function onVerifyPassword() {
    if (!pending) return;
    if (!password.trim()) {
      setError(t("errPasswordRequired"));
      return;
    }
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await confirmTelegramAuth(
        pending.phone,
        pending.phoneCodeHash,
        code,
        password,
      );
      if (res.success) {
        setStatus((prev) => ({
          ...prev,
          connected: true,
          phone: pending.phone,
          dailyCount: 0,
          isActive: true,
        }));
        setStep("idle");
        setPending(null);
        setCode("");
        setPassword("");
        setPhone("");
        setInfo(t("infoConnected"));
        return;
      }
      setError(res.error ?? t("errVerifyFailed"));
    });
  }

  function onCancel() {
    setStep("idle");
    setPending(null);
    setCode("");
    setPassword("");
    setError(null);
    setInfo(null);
  }

  function onDisconnect() {
    if (!window.confirm(t("confirmDisconnect"))) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await disconnectTelegramSession();
      if (res.success) {
        setStatus({
          hasCredentials: false,
          connected: false,
          apiId: null,
          phone: null,
          dailyCount: 0,
          isActive: false,
        });
        setShowInstructions(true);
        setInfo(t("infoDisconnected"));
      } else {
        setError(res.error ?? t("errDisconnectFailed"));
      }
    });
  }

  const showCredentialsForm = !status.hasCredentials;
  const showPhoneForm = status.hasCredentials && !status.connected && step === "idle";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-flux-border dark:bg-flux-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-flux-text">
            {t("title")}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-flux-muted">
            {t("subtitle")}
          </p>
        </div>
        <StatusPill
          connected={status.connected}
          hasCreds={status.hasCredentials}
          t={t}
        />
      </header>

      {/* === STAGE A: API credentials === */}
      {showCredentialsForm && (
        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-left text-xs text-purple-900 transition-colors hover:bg-purple-100 dark:border-flux-purple/40 dark:bg-flux-purple/10 dark:text-flux-purple-soft dark:hover:bg-flux-purple/15"
          >
            <span className="font-semibold uppercase tracking-wider">
              {t("credsAccordion")}
            </span>
            <span className="font-mono">{showInstructions ? "−" : "+"}</span>
          </button>

          {showInstructions && (
            <ol className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-700 dark:border-flux-border dark:bg-flux-bg dark:text-flux-text">
              <li>
                {t.rich("credsStep1", {
                  link: (chunks) => (
                    <a
                      href="https://my.telegram.org/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-purple-700 underline hover:text-purple-900 dark:text-flux-purple-soft dark:hover:text-flux-purple"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </li>
              <li>{t("credsStep2")}</li>
              <li>
                {t("credsStep3Header")}
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-zinc-500 dark:text-flux-muted">
                  <li>
                    {t.rich("credsStep3AppTitle", {
                      strong: (c) => <strong>{c}</strong>,
                      em: (c) => <em>{c}</em>,
                    })}
                  </li>
                  <li>
                    {t.rich("credsStep3ShortName", {
                      strong: (c) => <strong>{c}</strong>,
                      em: (c) => <em>{c}</em>,
                    })}
                  </li>
                  <li>
                    {t.rich("credsStep3Platform", {
                      strong: (c) => <strong>{c}</strong>,
                      em: (c) => <em>{c}</em>,
                    })}
                  </li>
                  <li>{t("credsStep3UrlDesc")}</li>
                </ul>
              </li>
              <li>
                {t.rich("credsStep4", {
                  strong: (c) => <strong>{c}</strong>,
                  code: (c) => (
                    <code className="font-mono text-purple-700 dark:text-flux-purple-soft">
                      {c}
                    </code>
                  ),
                })}
              </li>
              <li>{t("credsStep5")}</li>
              <li className="border-t border-zinc-200 pt-2 text-[10px] text-zinc-500 dark:border-flux-border dark:text-flux-muted">
                {t("credsSecurity")}
              </li>
            </ol>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-flux-muted">
                {t("apiIdLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                value={apiIdInput}
                onChange={(e) => setApiIdInput(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-flux-muted">
                {t("apiHashLabel")}
              </label>
              <input
                type="text"
                placeholder="0123456789abcdef0123456789abcdef"
                value={apiHashInput}
                onChange={(e) => setApiHashInput(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                spellCheck={false}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSaveCreds}
            disabled={isSubmitting}
            className="inline-flex h-[42px] items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:opacity-60 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
          >
            {isSubmitting ? t("savingCreds") : t("saveCreds")}
          </button>
        </div>
      )}

      {/* === STAGE B: connected card === */}
      {status.connected && step === "idle" && (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-flux-border dark:bg-flux-bg sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-flux-muted">
              {t("connectedPhone")}
            </p>
            <p className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-flux-text">
              {status.phone}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-flux-muted">
              {t("sentToday", { count: status.dailyCount })}
              {status.apiId ? t("appIdSuffix", { apiId: status.apiId }) : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-95 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
          >
            {t("disconnect")}
          </button>
        </div>
      )}

      {/* === STAGE C: phone form (creds saved, no session) === */}
      {showPhoneForm && (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-zinc-600 dark:text-flux-muted">
            {t("phoneInstruction")}
            {status.apiId ? (
              <span className="ml-1 text-zinc-400 dark:text-flux-muted">
                {t("appIdSuffix", { apiId: status.apiId })}
              </span>
            ) : null}
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="tel"
              placeholder="+380501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              inputMode="tel"
              autoComplete="tel"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple"
            />
            <button
              type="button"
              onClick={onSendCode}
              disabled={isSubmitting}
              className="inline-flex h-[42px] items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:opacity-60 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
            >
              {isSubmitting ? t("sending") : t("sendCode")}
            </button>
          </div>
        </div>
      )}

      {step === "code" && pending && (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-zinc-600 dark:text-flux-muted">
            {t("codeInstruction", { phone: pending.phone })}
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              inputMode="numeric"
              placeholder="12345"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
              autoComplete="one-time-code"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 font-mono text-base tracking-widest text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple"
            />
            <button
              type="button"
              onClick={onVerifyCode}
              disabled={isSubmitting}
              className="inline-flex h-[42px] items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:opacity-60 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
            >
              {isSubmitting ? t("verifying") : t("verify")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex h-[42px] items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-50 active:scale-95 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:bg-flux-bg"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {step === "password" && pending && (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-zinc-600 dark:text-flux-muted">
            {t("passwordInstruction")}
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple"
            />
            <button
              type="button"
              onClick={onVerifyPassword}
              disabled={isSubmitting}
              className="inline-flex h-[42px] items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:opacity-60 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
            >
              {isSubmitting ? t("verifying") : t("verify")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex h-[42px] items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-50 active:scale-95 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:bg-flux-bg"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {info && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {info}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-flux-muted">
        {t("disclaimer")}
      </p>
    </section>
  );
}

function StatusPill({
  connected,
  hasCreds,
  t,
}: {
  connected: boolean;
  hasCreds: boolean;
  t: (key: string) => string;
}) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t("statusConnected")}
      </span>
    );
  }
  if (hasCreds) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t("statusStep2")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-flux-border dark:bg-flux-bg dark:text-flux-muted">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
      {t("statusDisconnected")}
    </span>
  );
}
