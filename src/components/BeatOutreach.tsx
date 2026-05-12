"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  useMemo,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import { generateBeatProposal } from "@/src/actions/aiActions";
import {
  searchBeatProspects,
  sendBeatMessage,
  type DemoMeta,
} from "@/src/actions/beatActions";
import type { BeatProspect } from "@/src/lib/beatProspects";
import {
  CHANNELS,
  channelTranslated,
  getAvailableChannels,
  resolveBeatsProfileHref,
  type ChannelKey,
} from "@/src/lib/channels";

interface DemoState {
  name: string;
  bytes: number;
  type: string;
  url: string;
  bpm: string;
  keySig: string;
  genre: string;
  price: string;
}

export default function BeatOutreach() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("BeatOutreach");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BeatProspect[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [watermark, setWatermark] = useState(true);
  // We hydrate from localStorage AFTER initial render to keep server- and
  // client-side first paints identical (avoids React hydration mismatch).
  // The setState-in-effect lint warns about cascading renders, which is the
  // intentional and only safe pattern for SSR + browser-only storage.
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const selectedProspects = useMemo(
    () => results.filter((a) => selected.includes(a.handle)),
    [results, selected]
  );
  const pendingProspects = selectedProspects.filter(
    (a) => !sentMap[a.handle]
  );

  function toggleSelect(handle: string) {
    setSelected((s) =>
      s.includes(handle) ? s.filter((h) => h !== handle) : [...s, handle]
    );
  }

  function handleSent(handle: string) {
    setSentMap((m) => ({ ...m, [handle]: true }));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div id="tour-search-form">
        <StepCard n={1} title={t("step1Title")} active>
          <ArtistSearch
            query={query}
            setQuery={setQuery}
            onResults={(r) => {
              setResults(r);
              setSearched(true);
              setSearchError(null);
              setSelected([]);
            }}
            onError={(err) => {
              setResults([]);
              setSearched(true);
              setSearchError(err);
              setSelected([]);
            }}
          />

          <SearchResults
            searched={searched}
            results={results}
            error={searchError}
            selectedHandles={selected}
            onToggle={toggleSelect}
          />

          {results.length > 0 && (
            <p
              className={`mt-3 text-xs ${
                selectedProspects.length ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              {selectedProspects.length
                ? t("pickedCount", { count: selectedProspects.length })
                : t("pickArtist")}
            </p>
          )}
        </StepCard>
      </div>

      <div id="tour-beats-step-demo">
        <StepCard
          n={2}
          title={t("step2Title")}
          active={selectedProspects.length > 0}
        >
        {selectedProspects.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{t("selectFirst")}</p>
        ) : (
          <DemoUploader
            demo={demo}
            onChange={setDemo}
            watermark={watermark}
            onWatermarkChange={setWatermark}
          />
        )}
        </StepCard>
      </div>

      <div id="tour-beats-messages">
        <StepCard
          n={3}
          title={t("step3Title")}
          active={!!(selectedProspects.length && demo)}
        >
        {!demo || !selectedProspects.length ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{t("selectAndDemo")}</p>
        ) : (
          <div className="space-y-3">
            <p className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {t("flowNoteBefore")}
              <Link
                href="/settings"
                className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
              >
                {t("flowNoteSettings")}
              </Link>
              {t("flowNoteAfter")}
            </p>
            {selectedProspects.length > 1 && (
              <BulkSendBanner
                pending={pendingProspects.length}
                total={selectedProspects.length}
                disabled={pendingProspects.length === 0}
              />
            )}
            <div className="space-y-3">
              {selectedProspects.map((artist) => (
                <MessageReview
                  key={artist.handle}
                  artist={artist}
                  demo={demo}
                  locale={locale}
                  forceSent={!!sentMap[artist.handle]}
                  onSent={() => handleSent(artist.handle)}
                  onRemove={() => toggleSelect(artist.handle)}
                />
              ))}
            </div>
          </div>
        )}
        </StepCard>
      </div>
    </div>
  );
}

// =====================================================================
// Step 1 — Search
// =====================================================================

interface ArtistSearchProps {
  query: string;
  setQuery: (v: string) => void;
  onResults: (results: BeatProspect[]) => void;
  onError: (error: string) => void;
}

function ArtistSearch({
  query,
  setQuery,
  onResults,
  onError,
}: ArtistSearchProps) {
  const t = useTranslations("BeatOutreach");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || pending) return;
    startTransition(async () => {
      const res = await searchBeatProspects(query);
      if (res.success) {
        onResults(res.prospects);
      } else {
        onError(res.error ?? t("resultsFailed"));
      }
    });
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={pending}
          className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed min-w-[160px]"
        >
          {pending && <Spinner className="h-4 w-4" />}
          <span>{pending ? t("aiSearching") : t("findBuyers")}</span>
        </button>
      </form>
      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">{t("searchFooter")}</p>
    </div>
  );
}

interface SearchResultsProps {
  searched: boolean;
  results: BeatProspect[];
  error: string | null;
  selectedHandles: string[];
  onToggle: (handle: string) => void;
}

function SearchResults({
  searched,
  results,
  error,
  selectedHandles,
  onToggle,
}: SearchResultsProps) {
  const t = useTranslations("BeatOutreach");
  if (!searched) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm dark:bg-zinc-900 dark:text-zinc-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11ZM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9Z"
            />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("idleTitle")}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("idleHint")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t("noResultsAlt")}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {results.map((artist) => (
        <ArtistCard
          key={artist.handle}
          artist={artist}
          selected={selectedHandles.includes(artist.handle)}
          onToggle={() => onToggle(artist.handle)}
        />
      ))}
    </div>
  );
}

interface ArtistCardProps {
  artist: BeatProspect;
  selected: boolean;
  onToggle: () => void;
}

function ArtistCard({ artist, selected, onToggle }: ArtistCardProps) {
  const t = useTranslations("BeatOutreach");
  const tc = useTranslations("Channels");
  const available = getAvailableChannels(artist.contacts);
  const profileHref = resolveBeatsProfileHref(artist.profileUrl, artist.contacts);

  function cardClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest("a")) return;
    onToggle();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={cardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`w-full text-left rounded-lg border p-4 transition-all cursor-pointer ${
        selected
          ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/40"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 truncate dark:text-zinc-50">
              {artist.handle}
            </span>
            {artist.lookingForType && (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 whitespace-nowrap">
                {t("cardSeeking")}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
            {artist.realName} · {artist.genre}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {profileHref ? (
              <a
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t("profileLink", { platform: artist.platform })}
              </a>
            ) : (
              <span>{artist.platform}</span>
            )}
            <span className="text-zinc-300 hidden sm:inline dark:text-zinc-600">·</span>
            <span className="tabular-nums">
              {t("cardFollowers", { count: fmtFollowers(artist.followers) })}
            </span>
          </div>
        </div>
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            selected
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-zinc-300 bg-white"
          }`}
        >
          {selected && <CheckIcon className="w-3.5 h-3.5" />}
        </span>
      </div>

      {available.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {available.map(({ def, value }) => {
            const ui = channelTranslated(def.key, tc);
            return (
              <a
                key={def.key}
                href={def.buildHref(value)}
                title={`${ui.label}: ${value}`}
                target={def.key === "phone" || def.key === "email" ? undefined : "_blank"}
                rel={def.key === "phone" || def.key === "email" ? undefined : "noopener noreferrer"}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              >
                <def.Icon className="w-3 h-3" />
                {ui.label}
              </a>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-amber-700">{t("contactsMissing")}</p>
      )}
    </div>
  );
}

// =====================================================================
// Step 2 — Demo upload
// =====================================================================

interface DemoUploaderProps {
  demo: DemoState | null;
  onChange: (next: DemoState | null) => void;
  watermark: boolean;
  onWatermarkChange: (v: boolean) => void;
}

function DemoUploader({
  demo,
  onChange,
  watermark,
  onWatermarkChange,
}: DemoUploaderProps) {
  const t = useTranslations("BeatOutreach");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({
      name: file.name,
      bytes: file.size,
      type: file.type,
      url,
      bpm: "",
      keySig: "",
      genre: "",
      price: "29",
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  if (!demo) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-purple-500 bg-purple-50"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm dark:bg-zinc-900 dark:text-zinc-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">{t("dropzoneTitle")}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("dropzoneHint")}</p>
      </div>
    );
  }

  const set = (patch: Partial<DemoState>) => onChange({ ...demo, ...patch });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M9 4.5a.75.75 0 00-1.085-.67l-7.5 4A.75.75 0 000 8.5v6.75a3.25 3.25 0 105.5 2.358V11l9-4.8V14.25a3.25 3.25 0 105.5 2.358V4.5a.75.75 0 00-1.085-.67L9 8.3V4.5z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 truncate dark:text-zinc-50">
            {demo.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{fmtBytes(demo.bytes)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors dark:text-zinc-500"
          aria-label={t("removeDemoAria")}
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <WatermarkedAudio src={demo.url} watermark={watermark} />
      <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer dark:text-zinc-400">
        <input
          type="checkbox"
          checked={watermark}
          onChange={(e) => onWatermarkChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-700"
        />
        <span>
          <span className="font-medium">{t("voiceTagLabel")}</span>
          <span className="text-zinc-400 dark:text-zinc-500">{" "}{t("voiceTagHint")}</span>
        </span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetaInput
          label={t("metaGenre")}
          value={demo.genre}
          onChange={(v) => set({ genre: v })}
          placeholder="Trap"
        />
        <MetaInput
          label={t("metaBpm")}
          value={demo.bpm}
          onChange={(v) => set({ bpm: v })}
          placeholder="140"
          type="number"
        />
        <MetaInput
          label={t("metaKey")}
          value={demo.keySig}
          onChange={(v) => set({ keySig: v })}
          placeholder="G min"
        />
        <MetaInput
          label={t("metaPriceShort")}
          value={demo.price}
          onChange={(v) => set({ price: v })}
          placeholder="29"
          type="number"
        />
      </div>
    </div>
  );
}

interface MetaInputProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function MetaInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: MetaInputProps) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 dark:text-zinc-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
      />
    </div>
  );
}

// =====================================================================
// Watermarked audio (Web Audio API tag every 10s)
// =====================================================================

function WatermarkedAudio({
  src,
  watermark,
}: {
  src: string;
  watermark: boolean;
}) {
  const t = useTranslations("BeatOutreach");
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const tagRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    function ensureCtx(): AudioContext | null {
      if (ctxRef.current) return ctxRef.current;
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      if (a) {
        const source = ctx.createMediaElementSource(a);
        source.connect(ctx.destination);
        sourceRef.current = source;
      }
      ctxRef.current = ctx;
      return ctx;
    }

    function scheduleTag() {
      const ctx = ctxRef.current;
      if (!watermark || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    function onPlay() {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!watermark) return;
      scheduleTag();
      tagRef.current = setInterval(scheduleTag, 10000);
    }

    function onPause() {
      if (tagRef.current) clearInterval(tagRef.current);
      tagRef.current = null;
    }

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
      if (tagRef.current) clearInterval(tagRef.current);
    };
  }, [watermark]);

  return (
    <div className="relative">
      <audio ref={audioRef} src={src} controls className="w-full h-10" />
      {watermark && (
        <span className="absolute -top-2 right-2 inline-flex items-center rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-sm">
          {t("demoBadge")}
        </span>
      )}
    </div>
  );
}

// =====================================================================
// Step 3 — per-artist message review + send
// =====================================================================

interface MessageReviewProps {
  artist: BeatProspect;
  demo: DemoState;
  locale: string;
  forceSent: boolean;
  onSent: () => void;
  onRemove: () => void;
}

function localBuildMessage(
  artist: BeatProspect,
  demo: DemoState,
  locale: string
): string {
  const firstName = artist.realName.split(" ")[0];
  const meta = [demo.bpm && `${demo.bpm} BPM`, demo.keySig].filter(Boolean).join(", ");
  const baseName = demo.name.replace(/\.(mp3|wav|m4a|flac)$/i, "");
  if (locale === "en") {
    return [
      `Hey ${firstName},`,
      "",
      `I've been listening to your tracks on ${artist.platform} — the ${artist.genre.toLowerCase()} vibe really lands. You're at the point where a fresh beat could make the track pop.`,
      "",
      `Sharing «${baseName}»${meta ? ` (${meta})` : ""}${
        demo.genre ? `, ${demo.genre.toLowerCase()}` : ""
      } — feels like it fits your flow.`,
      "",
      `Preview attached. If it works, I can do a lease at ${
        demo.price ? `$${demo.price}` : "a fair price"
      } and send trackouts.`,
      "",
      `Let me know what you think — even a quick “not for me” helps.`,
      "",
      "— NeoFlux",
    ].join("\n");
  }
  return [
    `Hey ${firstName},`,
    "",
    `Слухав твої треки на ${artist.platform} — вайб ${artist.genre.toLowerCase()} реально потрапляє. Думаю, ти зараз у точці, коли свіжий інструментал може дати треку, який вистрілить.`,
    "",
    `Скинув тобі біт «${baseName}»${meta ? ` (${meta})` : ""}${
      demo.genre ? `, ${demo.genre.toLowerCase()}` : ""
    } — мені здається, він точно під твій флоу.`,
    "",
    `Прев'ю — у вкладенні. Якщо зайде, дам lease за ${
      demo.price ? `$${demo.price}` : "розумну ціну"
    } і пришлю trackouts.`,
    "",
    "Дай знати, що думаєш — навіть просте «не моє» допоможе.",
    "",
    "— NeoFlux",
  ].join("\n");
}

function MessageReview({
  artist,
  demo,
  locale,
  forceSent,
  onSent,
  onRemove,
}: MessageReviewProps) {
  const t = useTranslations("BeatOutreach");
  const tc = useTranslations("Channels");
  const initialBody = useMemo(
    () => localBuildMessage(artist, demo, locale),
    [artist, demo, locale]
  );
  const [subject, setSubject] = useState(
    locale === "en"
      ? `Beat for your flow — ${artist.handle}`
      : `Біт під твій флоу — для ${artist.handle}`
  );
  const [body, setBody] = useState(initialBody);
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedChannels, setOpenedChannels] = useState<Set<ChannelKey>>(
    () => new Set()
  );

  const available = useMemo(
    () => getAvailableChannels(artist.contacts),
    [artist.contacts]
  );
  const profileHref = useMemo(
    () => resolveBeatsProfileHref(artist.profileUrl, artist.contacts),
    [artist.profileUrl, artist.contacts]
  );

  const isSaved = saved || forceSent;

  function handleRegenerate() {
    setError(null);
    startGenerate(async () => {
      const res = await generateBeatProposal({
        artist: {
          handle: artist.handle,
          realName: artist.realName,
          genre: artist.genre,
          platform: artist.platform,
          followers: artist.followers,
        },
        demo: {
          name: demo.name,
          bpm: demo.bpm || null,
          keySig: demo.keySig || null,
          genre: demo.genre || null,
          price: demo.price || null,
        },
      });
      if (res.success && res.text) {
        setBody(res.text);
      } else {
        setError(res.error ?? t("errRegenerate"));
      }
    });
  }

  async function copyMessageToClipboard() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch {
      setError(t("errClipboard"));
      return false;
    }
  }

  async function handleOpenChannel(key: ChannelKey, value: string) {
    setError(null);
    const def = CHANNELS[key];
    const href = def.buildHref(value, { subject, body });

    // Copy first so the user can paste even into platforms that don't
    // support a URL prefill (Instagram, SoundCloud, BeatStars, etc.).
    if (!def.prefillsMessage) {
      await copyMessageToClipboard();
    }

    window.open(href, "_blank", "noopener,noreferrer");
    setOpenedChannels((s) => {
      const next = new Set(s);
      next.add(key);
      return next;
    });
  }

  function handleSaveToCrm() {
    setError(null);
    const demoMeta: DemoMeta = {
      name: demo.name,
      bytes: demo.bytes,
      bpm: demo.bpm || null,
      keySig: demo.keySig || null,
      genre: demo.genre || null,
      price: demo.price || null,
    };
    startSave(async () => {
      const res = await sendBeatMessage({
        artist,
        subject,
        body,
        demo: demoMeta,
        channels: Array.from(openedChannels),
      });
      if (res.success) {
        setSaved(true);
        onSent();
      } else {
        setError(res.error ?? t("errSave"));
      }
    });
  }

  const openedCount = openedChannels.size;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {profileHref ? (
              <a
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-600 hover:underline"
              >
                {artist.handle}
              </a>
            ) : (
              artist.handle
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {available.length > 0
              ? t("channelsAvailable", { count: available.length })
              : t("noPublicContacts", { platform: artist.platform })}
          </p>
        </div>
        {!isSaved && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-400 hover:text-red-600 transition-colors dark:text-zinc-500"
          >
            {t("remove")}
          </button>
        )}
      </div>

      {isSaved ? (
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("savedHeading")}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("savedBody")}
              {openedCount > 0 && (
                <>
                  {" "}
                  · {t("sentViaSuffix")}{" "}
                  {Array.from(openedChannels)
                    .map((k) => channelTranslated(k, tc).label)
                    .join(", ")}
                </>
              )}
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 dark:text-zinc-400">
              {t("reviewSubject")}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 dark:text-zinc-400">
              {t("letterBody")}
            </label>
            <textarea
              value={body}
              rows={9}
              onChange={(e) => setBody(e.target.value)}
              className="block w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
            />
          </div>

          {demo && (
            <div className="flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs">
              <span className="text-violet-700">♪</span>
              <span className="font-medium text-violet-900 truncate">
                {demo.name}
              </span>
              <span className="text-violet-700/70">
                · {fmtBytes(demo.bytes)}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={generating || saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {generating ? (
                <Spinner className="w-3 h-3" />
              ) : (
                <SparkleIcon className="w-3 h-3" />
              )}
              {generating ? t("reviewGenerating") : t("regenerateAi")}
            </button>
            <button
              type="button"
              onClick={copyMessageToClipboard}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                copied
                  ? "bg-green-50 text-green-700 ring-green-200"
                  : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : (
                <ClipboardIcon className="w-3.5 h-3.5" />
              )}
              {copied ? t("reviewCopied") : t("reviewCopy")}
            </button>
          </div>

          {available.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t("channelsHeadingLower")}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {openedCount > 0
                    ? t("openedCount", { count: openedCount })
                    : t("clickToOpenMessenger")}
                </p>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {available.map(({ def, value }) => {
                  const opened = openedChannels.has(def.key);
                  const ui = channelTranslated(def.key, tc);
                  return (
                    <button
                      key={def.key}
                      type="button"
                      onClick={() => handleOpenChannel(def.key, value)}
                      disabled={!subject.trim() || !body.trim()}
                      title={`${ui.label}: ${value}\n${ui.hint}`}
                      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        opened
                          ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <def.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{ui.label}</span>
                        <span className="text-zinc-400 truncate dark:text-zinc-500">
                          {value.length > 24 ? `${value.slice(0, 24)}…` : value}
                        </span>
                      </span>
                      {opened ? (
                        <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <span className="text-[10px] font-medium text-purple-600 whitespace-nowrap">
                          {t("open")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t("noPrefillHint")}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {openedCount === 0
                ? t("saveHintNoChannel")
                : t("saveHintChannels", {
                    count: openedCount,
                    channelsWord:
                      openedCount === 1 ? t("channelOne") : t("channelMany"),
                  })}
            </p>
            <button
              type="button"
              onClick={handleSaveToCrm}
              disabled={
                saving ||
                openedCount === 0 ||
                !subject.trim() ||
                !body.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
            >
              {saving && <Spinner className="h-4 w-4" />}
              <span>{saving ? t("reviewSaving") : t("reviewSaveCrm")}</span>
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

function BulkSendBanner({
  pending,
  total,
  disabled,
}: {
  pending: number;
  total: number;
  disabled: boolean;
}) {
  const t = useTranslations("BeatOutreach");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <div className="text-sm text-purple-900">
        <span className="font-semibold">
          {t("bulkHeading", { pending, total })}
        </span>
        <span className="block text-xs text-purple-700/80 mt-0.5">
          {disabled ? t("bulkAllSent") : t("bulkManual")}
        </span>
      </div>
    </div>
  );
}

// =====================================================================
// Helpers + atom UI
// =====================================================================

function StepCard({
  n,
  title,
  active,
  children,
}: {
  n: number | string;
  title: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-md border bg-white p-5 shadow-sm transition-opacity dark:bg-zinc-900 ${
        active
          ? "border-zinc-200 opacity-100 dark:border-zinc-800"
          : "border-zinc-100 opacity-60 dark:border-zinc-800/60"
      }`}
    >
      <header className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            active
              ? "bg-purple-500 text-white"
              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
        >
          {n}
        </span>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

function fmtFollowers(n: number): string {
  if (n >= 1000)
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.47 5.47a.75.75 0 0 1 1.06 0L10 8.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L11.06 10l3.47 3.47a.75.75 0 1 1-1.06 1.06L10 11.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L8.94 10 5.47 6.53a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"
      />
    </svg>
  );
}

function ClipboardIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5v-3.75A2.75 2.75 0 0 0 10.75 7.5H7v-2.25c0-1.21.92-2.205 2.099-2.235l.022-.001A.75.75 0 0 1 9.25 3h6a.75.75 0 0 1 .738.012Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 10.25A2.25 2.25 0 0 1 4.25 8h6.5A2.25 2.25 0 0 1 13 10.25v6.5A2.25 2.25 0 0 1 10.75 19h-6.5A2.25 2.25 0 0 1 2 16.75v-6.5Z"
      />
    </svg>
  );
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
