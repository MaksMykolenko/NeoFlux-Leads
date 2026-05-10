"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  useMemo,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { generateBeatProposal } from "@/src/actions/aiActions";
import {
  searchBeatProspects,
  sendBeatMessage,
  type DemoMeta,
} from "@/src/actions/beatActions";
import type { BeatProspect } from "@/src/lib/beatProspects";

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

interface SmtpDraft {
  provider: string;
  from: string;
  user: string;
  host: string;
  port: number | string;
  pass: string;
}

const SMTP_STORAGE_KEY = "nf.smtp";

export default function BeatOutreach() {
  const router = useRouter();
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
  const [smtp, setSmtp] = useState<SmtpDraft | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SMTP_STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSmtp(JSON.parse(raw) as SmtpDraft);
      }
    } catch {
      // localStorage may be disabled / quota exceeded — ignore.
    }
  }, []);

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

  function persistSmtp(next: SmtpDraft) {
    setSmtp(next);
    try {
      localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function handleSent(handle: string) {
    setSentMap((m) => ({ ...m, [handle]: true }));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <StepCard n={1} title="Знайдіть потенційних покупців" active>
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
              selectedProspects.length ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {selectedProspects.length
              ? `Вибрано: ${selectedProspects.length}`
              : "Виберіть одного або декількох артистів, кому надішлемо біт."}
          </p>
        )}
      </StepCard>

      <StepCard
        n={2}
        title="Завантажте демку біта"
        active={selectedProspects.length > 0}
      >
        {selectedProspects.length === 0 ? (
          <p className="text-sm text-gray-400">Спочатку виберіть артиста.</p>
        ) : (
          <DemoUploader
            demo={demo}
            onChange={setDemo}
            watermark={watermark}
            onWatermarkChange={setWatermark}
          />
        )}
      </StepCard>

      <StepCard n="✉" title="Акаунт для надсилання" active={!!demo}>
        <SmtpConfig value={smtp} onChange={persistSmtp} />
        <p className="mt-3 text-[11px] text-gray-400">
          Реальна відправка через SMTP додасться у наступних релізах. Зараз
          натискання «Надіслати» зберігає лід у CRM зі статусом{" "}
          <span className="font-semibold text-gray-600">Contacted</span>.
        </p>
      </StepCard>

      <StepCard
        n={3}
        title="Перегляньте та надішліть повідомлення"
        active={!!(selectedProspects.length && demo)}
      >
        {!demo || !selectedProspects.length ? (
          <p className="text-sm text-gray-400">
            Виберіть артиста і завантажте біт — згенеруємо лист під кожного.
          </p>
        ) : (
          <div className="space-y-3">
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
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || pending) return;
    startTransition(async () => {
      const res = await searchBeatProspects(query);
      if (res.success) {
        onResults(res.prospects);
      } else {
        onError(res.error ?? "Пошук не вдався");
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
          placeholder="Жанр, платформа, місто, ключове слово (напр. ukrainian trap soundcloud, drill rapper looking for type beats)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={pending}
          className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed min-w-[160px]"
        >
          {pending && <Spinner className="h-4 w-4" />}
          <span>{pending ? "AI шукає…" : "Знайти покупців"}</span>
        </button>
      </form>
      <p className="mt-2 text-[11px] text-gray-400">
        Пошук через Gemini AI з Google Search grounding по живих профілях
        SoundCloud / YouTube / Instagram / BeatStars. Зазвичай 10–20 секунд.
        Перевіряйте знайдені email перед відправкою.
      </p>
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
  if (!searched) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
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
        <p className="mt-3 text-sm font-medium text-gray-700">
          AI знайде реальних артистів за вашим запитом
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Введіть жанр чи нішу й натисніть «Знайти покупців» — Gemini пошукає
          активні профілі з живими контактами.
        </p>
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
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Нічого не знайдено. Спробуйте інший запит.
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
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-100 bg-blue-50/40"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {artist.handle}
            </span>
            {artist.lookingForType && (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 whitespace-nowrap">
                шукає type beats
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {artist.realName} · {artist.genre}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{artist.platform}</span>
            <span className="text-gray-300">·</span>
            <span className="tabular-nums">
              {fmtFollowers(artist.followers)} фоловерів
            </span>
            {artist.email && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-700 truncate">{artist.email}</span>
              </>
            )}
          </div>
        </div>
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            selected
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          {selected && <CheckIcon className="w-3.5 h-3.5" />}
        </span>
      </div>
      {!artist.email && (
        <p className="mt-2 text-[11px] text-amber-700">
          ⚠ Без публічного email — потрібно буде писати в DM на платформі.
        </p>
      )}
    </button>
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
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
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
        <p className="mt-3 text-sm font-medium text-gray-900">
          Перетягніть біт сюди
        </p>
        <p className="mt-1 text-xs text-gray-500">
          MP3 / WAV / M4A · клацніть для вибору файлу
        </p>
      </div>
    );
  }

  const set = (patch: Partial<DemoState>) => onChange({ ...demo, ...patch });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
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
          <p className="text-sm font-semibold text-gray-900 truncate">
            {demo.name}
          </p>
          <p className="text-xs text-gray-500">{fmtBytes(demo.bytes)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Видалити демо"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <WatermarkedAudio src={demo.url} watermark={watermark} />
      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={watermark}
          onChange={(e) => onWatermarkChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
        />
        <span>
          <span className="font-medium">Voice-tag водяний знак</span>
          <span className="text-gray-400">
            {" "}
            — «НеоФлюкс біт» кожні ~10с (як на BeatStars).
          </span>
        </span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetaInput
          label="Жанр"
          value={demo.genre}
          onChange={(v) => set({ genre: v })}
          placeholder="Trap"
        />
        <MetaInput
          label="BPM"
          value={demo.bpm}
          onChange={(v) => set({ bpm: v })}
          placeholder="140"
          type="number"
        />
        <MetaInput
          label="Тональність"
          value={demo.keySig}
          onChange={(v) => set({ keySig: v })}
          placeholder="G min"
        />
        <MetaInput
          label="Ціна, $"
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
      <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          DEMO·watermarked
        </span>
      )}
    </div>
  );
}

// =====================================================================
// SMTP config (localStorage-backed; not yet wired to real sending)
// =====================================================================

const PROVIDERS = [
  { id: "gmail", label: "Gmail / Google Workspace", host: "smtp.gmail.com", port: 587 },
  { id: "ukr", label: "Ukr.net", host: "smtp.ukr.net", port: 465 },
  { id: "sendgrid", label: "SendGrid", host: "smtp.sendgrid.net", port: 587 },
  { id: "custom", label: "Власний SMTP", host: "", port: 587 },
] as const;

function SmtpConfig({
  value,
  onChange,
}: {
  value: SmtpDraft | null;
  onChange: (v: SmtpDraft) => void;
}) {
  const [open, setOpen] = useState(!value);
  const [draft, setDraft] = useState<SmtpDraft>(
    value ?? {
      provider: "gmail",
      from: "",
      user: "",
      host: "smtp.gmail.com",
      port: 587,
      pass: "",
    }
  );

  function pickProvider(id: string) {
    const p = PROVIDERS.find((x) => x.id === id);
    if (!p) return;
    setDraft((d) => ({ ...d, provider: id, host: p.host || d.host, port: p.port }));
  }

  function save() {
    onChange(draft);
    setOpen(false);
  }

  if (value && !open) {
    const provider = PROVIDERS.find((p) => p.id === value.provider);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
            <CheckIcon className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="font-medium text-gray-900">
              {value.from || value.user}
            </div>
            <div className="text-xs text-gray-500">
              {value.host}:{value.port} · {provider?.label ?? "SMTP"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Змінити
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pickProvider(p.id)}
            className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
              draft.provider === p.id
                ? "border-blue-500 ring-2 ring-blue-100 bg-blue-50/40"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="font-medium text-gray-900">{p.label}</div>
            <div className="text-xs text-gray-500">
              {p.host || "Налаштувати вручну"}
            </div>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetaInput
          label="Від кого (email)"
          value={draft.from}
          onChange={(v) => setDraft({ ...draft, from: v })}
          placeholder="you@studio.com"
        />
        <MetaInput
          label="Логін"
          value={draft.user}
          onChange={(v) => setDraft({ ...draft, user: v })}
          placeholder="you@studio.com"
        />
        <MetaInput
          label="SMTP host"
          value={draft.host}
          onChange={(v) => setDraft({ ...draft, host: v })}
          placeholder="smtp.gmail.com"
        />
        <MetaInput
          label="Порт"
          value={draft.port}
          onChange={(v) => setDraft({ ...draft, port: v })}
          placeholder="587"
          type="number"
        />
        <div className="sm:col-span-2">
          <MetaInput
            label="Пароль / App password"
            value={draft.pass}
            onChange={(v) => setDraft({ ...draft, pass: v })}
            placeholder="••••••••"
            type="password"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-400">
          Дані зберігаються локально в браузері і ніколи не виходять на наші
          сервери.
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!draft.from || !draft.user}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed min-w-[140px]"
        >
          Зберегти
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// Step 3 — per-artist message review + send
// =====================================================================

interface MessageReviewProps {
  artist: BeatProspect;
  demo: DemoState;
  forceSent: boolean;
  onSent: () => void;
  onRemove: () => void;
}

function localBuildMessage(artist: BeatProspect, demo: DemoState): string {
  const firstName = artist.realName.split(" ")[0];
  const meta = [demo.bpm && `${demo.bpm} BPM`, demo.keySig].filter(Boolean).join(", ");
  const baseName = demo.name.replace(/\.(mp3|wav|m4a|flac)$/i, "");
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
  forceSent,
  onSent,
  onRemove,
}: MessageReviewProps) {
  const initialBody = useMemo(
    () => localBuildMessage(artist, demo),
    [artist, demo]
  );
  const [subject, setSubject] = useState(
    `Біт під твій флоу — для ${artist.handle}`
  );
  const [body, setBody] = useState(initialBody);
  const [generating, startGenerate] = useTransition();
  const [sending, startSend] = useTransition();
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSent = sent || forceSent;

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
        setError(res.error ?? "Не вдалось перегенерувати");
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Не вдалось скопіювати");
    }
  }

  function handleSend() {
    setError(null);
    const demoMeta: DemoMeta = {
      name: demo.name,
      bytes: demo.bytes,
      bpm: demo.bpm || null,
      keySig: demo.keySig || null,
      genre: demo.genre || null,
      price: demo.price || null,
    };
    startSend(async () => {
      const res = await sendBeatMessage({
        artist,
        subject,
        body,
        demo: demoMeta,
      });
      if (res.success) {
        setSent(true);
        onSent();
      } else {
        setError(res.error ?? "Не вдалось зберегти");
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div>
          <p className="text-sm font-semibold text-gray-900">{artist.handle}</p>
          <p className="text-xs text-gray-500">
            {artist.email
              ? `Лист на ${artist.email}`
              : `DM на ${artist.platform}`}
          </p>
        </div>
        {!isSent && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Прибрати
          </button>
        )}
      </div>

      {isSent ? (
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Збережено</p>
            <p className="text-xs text-gray-500">
              Лід додано в історію зі статусом Contacted.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Тема
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Текст листа
            </label>
            <textarea
              value={body}
              rows={10}
              onChange={(e) => setBody(e.target.value)}
              className="block w-full resize-y rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={generating || sending}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {generating ? (
                  <Spinner className="w-3 h-3" />
                ) : (
                  <SparkleIcon className="w-3 h-3" />
                )}
                {generating ? "Генерую…" : "Перегенерувати (AI)"}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  copied
                    ? "bg-green-50 text-green-700 ring-green-200"
                    : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100"
                }`}
              >
                {copied ? (
                  <CheckIcon className="w-3.5 h-3.5" />
                ) : (
                  <ClipboardIcon className="w-3.5 h-3.5" />
                )}
                {copied ? "Скопійовано" : "Копіювати"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {sending && <Spinner className="h-4 w-4" />}
              <span>{sending ? "Зберігаю…" : "Надіслати"}</span>
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="text-sm text-blue-900">
        <span className="font-semibold">
          Масове надсилання — {pending}/{total} адресатів
        </span>
        <span className="block text-xs text-blue-700/80 mt-0.5">
          {disabled
            ? "Всім, кого вибрали, вже надіслано."
            : "Надішліть кожному вручну нижче — біт точно той самий."}
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
      className={`rounded-xl border bg-white shadow-sm p-5 transition-opacity ${
        active ? "border-gray-200 opacity-100" : "border-gray-100 opacity-60"
      }`}
    >
      <header className="flex items-center gap-3 mb-4">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          {n}
        </span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
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
