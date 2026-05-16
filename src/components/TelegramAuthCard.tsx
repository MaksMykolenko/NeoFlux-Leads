"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  confirmTelegramAuth,
  disconnectTelegramSession,
  startTelegramAuth,
} from "@/src/actions/telegramActions";

interface InitialStatus {
  connected: boolean;
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
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

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
        setError(res.error ?? t("errStartFailed"));
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
        setStatus({
          connected: true,
          phone: pending.phone,
          dailyCount: 0,
          isActive: true,
        });
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
        setStatus({
          connected: true,
          phone: pending.phone,
          dailyCount: 0,
          isActive: true,
        });
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
          connected: false,
          phone: null,
          dailyCount: 0,
          isActive: false,
        });
        setInfo(t("infoDisconnected"));
      } else {
        setError(res.error ?? t("errDisconnectFailed"));
      }
    });
  }

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
        <StatusPill connected={status.connected} t={t} />
      </header>

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

      {!status.connected && step === "idle" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
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
  t,
}: {
  connected: boolean;
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
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-flux-border dark:bg-flux-bg dark:text-flux-muted">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
      {t("statusDisconnected")}
    </span>
  );
}
