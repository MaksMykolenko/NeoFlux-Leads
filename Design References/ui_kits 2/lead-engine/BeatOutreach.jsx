/* global React, PrimaryButton, AIButton, SecondaryButton, Card, CardEyebrow, CardTitle, StatusPill, Sparkle, Check, Clipboard, EnvelopeOutline, Spinner, X */
const { createElement: h, useState, useRef, useMemo } = React;

// ======================================================================
// BeatOutreach — простий потік:
// 1) пошук артистів  →  2) залити демо  →  3) AI-повідомлення  →  4) надіслати
// ======================================================================

const SEED_ARTISTS = [
  { handle: "@youngluna.beats", realName: "Артем Луна",   genre: "Trap / Drill",   platform: "SoundCloud", followers: 4200,  email: "luna.beats@gmail.com",       lookingForType: true },
  { handle: "@kyivflow",        realName: "MC Kyivflow",  genre: "Hip-Hop",        platform: "YouTube",    followers: 12400, email: "booking@kyivflow.ua",        lookingForType: true },
  { handle: "@meri.rnb",        realName: "Meri",         genre: "R&B / Pop",      platform: "Instagram",  followers: 27800, email: null,                          lookingForType: false },
  { handle: "@nightowl.flow",   realName: "Night Owl",    genre: "Drill / Phonk",  platform: "SoundCloud", followers: 8100,  email: "nightowl.contact@gmail.com",  lookingForType: true },
  { handle: "@kosmo.808",       realName: "Kosmo",        genre: "Trap",           platform: "YouTube",    followers: 5600,  email: "kosmo808@proton.me",          lookingForType: true },
  { handle: "@vira.melodic",    realName: "Віра",         genre: "Melodic Trap",   platform: "Instagram",  followers: 19200, email: "vira.melodic@gmail.com",      lookingForType: true }
];

function fmtFollowers(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ----------------------------------------------------------------------
// Step 1: search
// ----------------------------------------------------------------------

function ArtistSearch({ onResults, query, setQuery }) {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const q = query.trim().toLowerCase();
      const results = q
        ? SEED_ARTISTS.filter((a) =>
            a.handle.toLowerCase().includes(q) ||
            a.genre.toLowerCase().includes(q) ||
            a.realName.toLowerCase().includes(q) ||
            a.platform.toLowerCase().includes(q)
          )
        : SEED_ARTISTS;
      onResults(results.length ? results : SEED_ARTISTS);
      setLoading(false);
    }, 700);
  }

  return h("form", { onSubmit: handleSubmit, className: "flex flex-col sm:flex-row gap-3" }, [
    h("input", {
      key: "q",
      type: "text",
      placeholder: "Жанр, плотформа або @нік (напр. trap, soundcloud, @luna)",
      value: query,
      onChange: (e) => setQuery(e.target.value),
      disabled: loading,
      className: "flex-1 rounded-lg border border-zinc-$1 bg-zinc-$1 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-60"
    }),
    h(PrimaryButton, { key: "b", pending: loading, className: "min-w-[160px]" },
      loading ? "Шукаю…" : "Знайти покупців"
    )
  ]);
}

function ArtistCard({ artist, selected, onToggle }) {
  return h("button", {
    type: "button",
    onClick: onToggle,
    className: `w-full text-left rounded-lg border p-4 transition-all ${
      selected
        ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/40"
        : "border-zinc-$1 bg-white hover:border-zinc-$1 hover:shadow-sm"
    }`
  }, [
    h("div", { key: "row", className: "flex items-start justify-between gap-3" }, [
      h("div", { key: "l", className: "min-w-0 flex-1" }, [
        h("div", { key: "h", className: "flex items-center gap-2" }, [
          h("span", { key: "n", className: "text-sm font-semibold text-zinc-$1 truncate" }, artist.handle),
          artist.lookingForType && h("span", {
            key: "lt",
            className: "inline-flex items-center rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 whitespace-nowrap"
          }, "шукає type beats")
        ]),
        h("p", { key: "r", className: "text-xs text-zinc-$1 mt-0.5" }, [
          artist.realName, " · ", artist.genre
        ]),
        h("div", { key: "m", className: "mt-2 flex items-center gap-3 text-xs text-zinc-$1" }, [
          h("span", { key: "p" }, artist.platform),
          h("span", { key: "d", className: "text-zinc-$1" }, "·"),
          h("span", { key: "f", className: "tabular-nums" }, `${fmtFollowers(artist.followers)} фоловерів`),
          artist.email && h("span", { key: "d2", className: "text-zinc-$1" }, "·"),
          artist.email && h("span", { key: "e", className: "text-zinc-$1 truncate" }, artist.email)
        ])
      ]),
      h("span", {
        key: "chk",
        className: `flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          selected ? "border-blue-600 bg-purple-600 text-white" : "border-zinc-$1 bg-white"
        }`
      }, selected && h(Check, { className: "w-3.5 h-3.5" }))
    ]),
    !artist.email && h("p", {
      key: "noe",
      className: "mt-2 text-[11px] text-amber-700"
    }, "⚠ Без публічного email — лист уйде в DM на платформі.")
  ]);
}

// ----------------------------------------------------------------------
// Step 2: upload demo
// ----------------------------------------------------------------------

function DemoUploader({ demo, onChange, watermark, onWatermarkChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      bpm: "",
      key: "",
      genre: "",
      price: "29"
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  if (!demo) {
    return h("div", {
      onDragOver: (e) => { e.preventDefault(); setDragOver(true); },
      onDragLeave: () => setDragOver(false),
      onDrop: handleDrop,
      onClick: () => inputRef.current?.click(),
      className: `cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver ? "border-purple-500 bg-purple-50" : "border-zinc-$1 bg-zinc-$1 hover:border-zinc-$1 hover:bg-zinc-$1"
      }`
    }, [
      h("input", {
        key: "i",
        ref: inputRef,
        type: "file",
        accept: "audio/*",
        className: "hidden",
        onChange: (e) => handleFile(e.target.files?.[0])
      }),
      h("div", {
        key: "ic",
        className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-$1 shadow-sm"
      }, h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "w-6 h-6" },
          h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" })
        )
      ),
      h("p", { key: "t", className: "mt-3 text-sm font-medium text-zinc-$1" }, "Перетягніть біт сюди"),
      h("p", { key: "h", className: "mt-1 text-xs text-zinc-$1" }, "MP3 / WAV / M4A · клацніть для вибору файлу")
    ]);
  }

  const set = (patch) => onChange({ ...demo, ...patch });

  return h("div", { className: "rounded-xl border border-zinc-$1 bg-white p-4 space-y-4" }, [
    h("div", { key: "row", className: "flex items-start gap-3" }, [
      h("div", {
        key: "ic",
        className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"
      }, h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className: "w-5 h-5" },
          h("path", { d: "M9 4.5a.75.75 0 00-1.085-.67l-7.5 4A.75.75 0 000 8.5v6.75a3.25 3.25 0 105.5 2.358V11l9-4.8V14.25a3.25 3.25 0 105.5 2.358V4.5a.75.75 0 00-1.085-.67L9 8.3V4.5z" })
        )
      ),
      h("div", { key: "i", className: "min-w-0 flex-1" }, [
        h("p", { key: "n", className: "text-sm font-semibold text-zinc-$1 truncate" }, demo.name),
        h("p", { key: "s", className: "text-xs text-zinc-$1" }, fmtBytes(demo.size))
      ]),
      h("button", {
        key: "x",
        type: "button",
        onClick: () => onChange(null),
        className: "p-1.5 rounded-md text-zinc-$1 hover:text-red-600 hover:bg-red-50 transition-colors",
        "aria-label": "Видалити демо"
      }, h(X, { className: "w-4 h-4" }))
    ]),
    h(WatermarkedAudio, {
      key: "a",
      src: demo.url,
      watermark
    }),
    h("label", {
      key: "wm",
      className: "flex items-center gap-2 text-xs text-zinc-$1 cursor-pointer"
    }, [
      h("input", {
        key: "i",
        type: "checkbox",
        checked: watermark,
        onChange: (e) => onWatermarkChange(e.target.checked),
        className: "h-3.5 w-3.5 rounded border-zinc-$1 text-violet-600 focus:ring-violet-500"
      }),
      h("span", { key: "t" }, [
        h("span", { key: "l", className: "font-medium" }, "Voice-tag водяний знак"),
        h("span", { key: "h", className: "text-zinc-$1" }, " — «НеоФлюкс біт» кожні ~10с (як на BeatStars).")
      ])
    ]),
    h("div", { key: "meta", className: "grid grid-cols-2 sm:grid-cols-4 gap-2" }, [
      h(MetaInput, { key: "g", label: "Жанр",       value: demo.genre, onChange: (v) => set({ genre: v }), placeholder: "Trap" }),
      h(MetaInput, { key: "b", label: "BPM",        value: demo.bpm,   onChange: (v) => set({ bpm: v }),   placeholder: "140",  type: "number" }),
      h(MetaInput, { key: "k", label: "Тональність",value: demo.key,   onChange: (v) => set({ key: v }),   placeholder: "G min" }),
      h(MetaInput, { key: "p", label: "Ціна, $",    value: demo.price, onChange: (v) => set({ price: v }), placeholder: "29",   type: "number" })
    ])
  ]);
}

function MetaInput({ label, value, onChange, placeholder, type = "text" }) {
  return h("div", null, [
    h("label", { key: "l", className: "block text-[10px] uppercase tracking-wider text-zinc-$1 mb-1" }, label),
    h("input", {
      key: "i",
      type,
      value,
      placeholder,
      onChange: (e) => onChange(e.target.value),
      className: "w-full rounded-md border border-zinc-$1 bg-zinc-$1 px-2.5 py-1.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
    })
  ]);
}

// ----------------------------------------------------------------------
// Step 3: AI message + send
// ----------------------------------------------------------------------

function buildMessage(artist, demo) {
  const parts = [
    `Hey ${artist.realName.split(" ")[0]},`,
    "",
    `Слухав твої треки на ${artist.platform} — вайб ${artist.genre.toLowerCase()} реально потрапляє. Думаю, ти зараз у точці, коли свіжий інструментал може дати треку, який вистрілить.`,
    "",
    `Скинув тобі біт «${demo?.name?.replace(/\.(mp3|wav|m4a|flac)$/i, "") || "untitled"}»${
      demo?.bpm || demo?.key
        ? ` (${[demo.bpm && `${demo.bpm} BPM`, demo.key].filter(Boolean).join(", ")})`
        : ""
    }${demo?.genre ? `, ${demo.genre.toLowerCase()}` : ""} — мені здається, він точно під твій флоу.`,
    "",
    "Прев'ю — у вкладенні. Якщо зайде, дам lease за " + (demo?.price ? `$${demo.price}` : "розумну ціну") + " і пришлю trackouts.",
    "",
    "Дай знати, що думаєш — навіть просте «не моє» допоможе.",
    "",
    "— NeoFlux"
  ];
  return parts.join("\n");
}

function MessageReview({ artist, demo, onSend, onBack, onRemove, forceSent }) {
  const initialSubject = `Біт під твій флоу — для ${artist.handle}`;
  const initialBody    = useMemo(() => buildMessage(artist, demo), [artist, demo]);

  const [subject, setSubject]       = useState(initialSubject);
  const [body, setBody]             = useState(initialBody);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [copied, setCopied]         = useState(false);

  function handleRegenerate() {
    setGenerating(true);
    setTimeout(() => {
      // Same builder w/ a bit of variety
      const variants = [
        buildMessage(artist, demo),
        buildMessage(artist, demo).replace("вайб", "звучання").replace("свіжий інструментал", "новий інструментал")
      ];
      setBody(variants[Math.floor(Math.random() * variants.length)]);
      setGenerating(false);
    }, 900);
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(`${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch {}
  }

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      onSend({ artist, subject, body, demo });
    }, 800);
  }

  return h("div", {
    className: "rounded-lg border border-zinc-$1 bg-white"
  }, [
    h("div", { key: "h", className: "flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-$1 bg-zinc-$1/60" }, [
      h("div", { key: "l" }, [
        h("p", { key: "t", className: "text-sm font-semibold text-zinc-$1" }, artist.handle),
        h("p", { key: "s", className: "text-xs text-zinc-$1" }, [
          artist.email ? `Лист на ${artist.email}` : `DM на ${artist.platform}`
        ])
      ]),
      h("button", {
        key: "rm",
        type: "button",
        onClick: onRemove,
        className: "text-xs text-zinc-$1 hover:text-red-600 transition-colors"
      }, "Прибрати")
    ]),

    sent || forceSent
      ? h("div", { key: "s", className: "flex items-center gap-3 px-4 py-6" }, [
          h("div", {
            key: "ic",
            className: "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
          }, h(Check, { className: "w-5 h-5" })),
          h("div", { key: "t" }, [
            h("p", { key: "1", className: "text-sm font-semibold text-zinc-$1" }, "Надіслано"),
            h("p", { key: "2", className: "text-xs text-zinc-$1" }, "Лід додано в історію зі статусом Contacted.")
          ])
        ])
      : h("div", { key: "b", className: "p-4 space-y-3" }, [
          h("div", { key: "subj" }, [
            h("label", { key: "l", className: "block text-[10px] uppercase tracking-wider text-zinc-$1 mb-1" }, "Тема"),
            h("input", {
              key: "i",
              type: "text",
              value: subject,
              onChange: (e) => setSubject(e.target.value),
              className: "block w-full rounded-md border border-zinc-$1 bg-zinc-$1 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            })
          ]),
          h("div", { key: "body" }, [
            h("label", { key: "l", className: "block text-[10px] uppercase tracking-wider text-zinc-$1 mb-1" }, "Текст листа"),
            h("textarea", {
              key: "t",
              value: body,
              rows: 10,
              onChange: (e) => setBody(e.target.value),
              className: "block w-full resize-y rounded-md border border-zinc-$1 bg-zinc-$1 px-3 py-2 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            })
          ]),
          demo && h("div", {
            key: "att",
            className: "flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs"
          }, [
            h("span", { key: "ic", className: "text-violet-700" }, "♪"),
            h("span", { key: "n", className: "font-medium text-violet-900 truncate" }, demo.name),
            h("span", { key: "s", className: "text-violet-700/70" }, `· ${fmtBytes(demo.size)}`)
          ]),
          h("div", { key: "act", className: "flex flex-wrap items-center justify-between gap-2 pt-1" }, [
            h("div", { key: "l", className: "flex items-center gap-2" }, [
              h("button", {
                key: "rg",
                type: "button",
                onClick: handleRegenerate,
                disabled: generating,
                className: "inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-wait"
              }, [
                generating ? h(Spinner, { key: "s", className: "w-3 h-3" }) : h(Sparkle, { key: "i", className: "w-3 h-3" }),
                generating ? "Генерую…" : "Перегенерувати"
              ]),
              h(SecondaryButton, {
                key: "cp",
                onClick: handleCopy,
                tone: copied ? "success" : "neutral",
                icon: copied ? h(Check, { className: "w-3.5 h-3.5" }) : h(Clipboard, { className: "w-3.5 h-3.5" })
              }, copied ? "Скопійовано" : "Копіювати")
            ]),
            h(PrimaryButton, {
              key: "send",
              onClick: handleSend,
              pending: sending,
              disabled: sending || !subject.trim() || !body.trim()
            }, sending ? "Надсилання…" : "Надіслати")
          ])
        ])
  ]);
}

// ----------------------------------------------------------------------
// Top-level
// ----------------------------------------------------------------------

// Plays an <audio>; when `watermark` is on, mixes a short "tag" tone every 10s
// (Web Audio MediaElementSource pipeline).
function WatermarkedAudio({ src, watermark }) {
  const audioRef = useRef(null);
  const ctxRef   = useRef(null);
  const tagRef   = useRef(null);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    function ensureCtx() {
      if (ctxRef.current) return ctxRef.current;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(a);
      source.connect(ctx.destination);
      ctxRef.current = ctx;
      return ctx;
    }
    function scheduleTag() {
      if (!watermark || !ctxRef.current) return;
      const ctx = ctxRef.current;
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
      // First tag immediately, then every 10s
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

  return h("div", { className: "relative" }, [
    h("audio", {
      key: "a",
      ref: audioRef,
      src,
      controls: true,
      className: "w-full h-10"
    }),
    watermark && h("span", {
      key: "b",
      className: "absolute -top-2 right-2 inline-flex items-center rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-sm"
    }, "DEMO·watermarked")
  ]);
}

function SmtpConfig({ value, onChange }) {
  const PROVIDERS = [
    { id: "gmail",    label: "Gmail / Google Workspace", host: "smtp.gmail.com",       port: 587 },
    { id: "ukr",      label: "Ukr.net",                  host: "smtp.ukr.net",         port: 465 },
    { id: "sendgrid", label: "SendGrid",                 host: "smtp.sendgrid.net",    port: 587 },
    { id: "custom",   label: "Власний SMTP",               host: "",                     port: 587 }
  ];
  const [open, setOpen]   = useState(!value);
  const [draft, setDraft] = useState(value || { provider: "gmail", from: "", host: "smtp.gmail.com", port: 587, user: "", pass: "" });

  function pickProvider(id) {
    const p = PROVIDERS.find((x) => x.id === id);
    setDraft((d) => ({ ...d, provider: id, host: p.host || d.host, port: p.port }));
  }
  function save() { onChange(draft); setOpen(false); }

  if (value && !open) {
    return h("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" }, [
      h("div", { key: "l", className: "flex items-center gap-2 text-sm" }, [
        h("span", { key: "i", className: "flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white" },
          h(Check, { className: "w-3.5 h-3.5" })
        ),
        h("div", { key: "t" }, [
          h("div", { key: "1", className: "font-medium text-zinc-$1" }, value.from || value.user),
          h("div", { key: "2", className: "text-xs text-zinc-$1" }, `${value.host}:${value.port} · ${PROVIDERS.find((p) => p.id === value.provider)?.label || "SMTP"}`)
        ])
      ]),
      h("button", {
        key: "b",
        type: "button",
        onClick: () => setOpen(true),
        className: "text-xs font-medium text-purple-600 hover:text-purple-700"
      }, "Змінити")
    ]);
  }

  return h("div", { className: "space-y-3" }, [
    h("div", { key: "prov", className: "grid gap-2 sm:grid-cols-2" },
      PROVIDERS.map((p) => h("button", {
        key: p.id,
        type: "button",
        onClick: () => pickProvider(p.id),
        className: `text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
          draft.provider === p.id
            ? "border-purple-500 ring-2 ring-purple-100 bg-purple-50/40"
            : "border-zinc-$1 bg-white hover:border-zinc-$1"
        }`
      }, [
        h("div", { key: "l", className: "font-medium text-zinc-$1" }, p.label),
        h("div", { key: "h", className: "text-xs text-zinc-$1" }, p.host || "Налаштувати вручну")
      ]))
    ),
    h("div", { key: "f", className: "grid gap-3 sm:grid-cols-2" }, [
      h(MetaInput, { key: "from", label: "Від кого (email)", value: draft.from, onChange: (v) => setDraft({ ...draft, from: v }), placeholder: "you@studio.com" }),
      h(MetaInput, { key: "user", label: "Логін",              value: draft.user, onChange: (v) => setDraft({ ...draft, user: v }), placeholder: "you@studio.com" }),
      h(MetaInput, { key: "host", label: "SMTP host",          value: draft.host, onChange: (v) => setDraft({ ...draft, host: v }), placeholder: "smtp.gmail.com" }),
      h(MetaInput, { key: "port", label: "Порт",               value: draft.port, onChange: (v) => setDraft({ ...draft, port: v }), placeholder: "587", type: "number" }),
      h("div", { key: "pw", className: "sm:col-span-2" },
        h(MetaInput, { label: "Пароль / App password", value: draft.pass, onChange: (v) => setDraft({ ...draft, pass: v }), placeholder: "••••••••", type: "password" })
      )
    ]),
    h("div", { key: "a", className: "flex items-center justify-between" }, [
      h("p", { key: "h", className: "text-[11px] text-zinc-$1" }, "Дані зберігаються локально в браузері і ніколи не виходять на наші сервери."),
      h(PrimaryButton, { key: "s", onClick: save, disabled: !draft.from || !draft.user, className: "min-w-[140px]" }, "Зберегти")
    ])
  ]);
}

function BeatOutreach({ onSent }) {
  const [query, setQuery]         = useState("trap");
  const [results, setResults]     = useState(SEED_ARTISTS);
  const [selectedIds, setSelected] = useState([]);
  const [demo, setDemo]            = useState(null);
  const [watermark, setWatermark]  = useState(true);
  const [smtp, setSmtp]            = useState(() => {
    try { return JSON.parse(localStorage.getItem("nf.smtp") || "null"); }
    catch { return null; }
  });
  const [sentMap, setSentMap]      = useState({}); // handle -> true
  const [bulkSending, setBulk]     = useState(false);

  const selected = results.filter((a) => selectedIds.includes(a.handle));
  const pending  = selected.filter((a) => !sentMap[a.handle]);

  function toggle(handle) {
    setSelected((s) => s.includes(handle) ? s.filter((h) => h !== handle) : [...s, handle]);
  }

  function handleSent({ artist, subject, body, demo }) {
    setSentMap((m) => ({ ...m, [artist.handle]: true }));
    onSent({
      handle: artist.handle,
      realName: artist.realName,
      platform: artist.platform,
      genre: artist.genre,
      email: artist.email,
      followers: artist.followers,
      subject,
      body,
      demoName: demo?.name || null
    });
  }

  function handleBulkSend() {
    if (!demo || pending.length === 0) return;
    setBulk(true);
    let i = 0;
    function step() {
      const a = pending[i];
      if (!a) { setBulk(false); return; }
      const subject = `Біт під твій флоу — для ${a.handle}`;
      const body    = buildMessage(a, demo);
      handleSent({ artist: a, subject, body, demo });
      i++;
      setTimeout(step, 600);
    }
    step();
  }

  return h("div", { className: "space-y-6" }, [
    // STEP 1
    h(StepCard, { key: "s1", n: 1, title: "Знайдіть потенційних покупців", active: true }, [
      h(ArtistSearch, { key: "f", query, setQuery, onResults: setResults }),
      h("div", { key: "list", className: "mt-4 grid gap-2 sm:grid-cols-2" },
        results.map((a) => h(ArtistCard, {
          key: a.handle,
          artist: a,
          selected: selectedIds.includes(a.handle),
          onToggle: () => toggle(a.handle)
        }))
      ),
      h("p", {
        key: "hint",
        className: `mt-3 text-xs ${selected.length ? "text-zinc-$1" : "text-zinc-$1"}`
      }, selected.length
        ? `Вибрано: ${selected.length}`
        : "Виберіть одного або декількох артистів, кому надішлемо біт."
      )
    ]),

    // STEP 2
    h(StepCard, { key: "s2", n: 2, title: "Завантажте демку біта", active: selected.length > 0 }, [
      selected.length === 0
        ? h("p", { key: "e", className: "text-sm text-zinc-$1" }, "Спочатку виберіть артиста.")
        : h(DemoUploader, { key: "u", demo, onChange: setDemo, watermark, onWatermarkChange: setWatermark })
    ]),

    // SMTP
    h(StepCard, { key: "smtp", n: "✉", title: "Акаунт для надсилання", active: !!demo },
      h(SmtpConfig, { value: smtp, onChange: (v) => {
        setSmtp(v);
        try { localStorage.setItem("nf.smtp", JSON.stringify(v)); } catch {}
      } })
    ),

    // STEP 3
    h(StepCard, { key: "s3", n: 3, title: "Перегляньте та надішліть повідомлення", active: !!(selected.length && demo) }, [
      !demo || !selected.length
        ? h("p", { key: "e", className: "text-sm text-zinc-$1" }, "Виберіть артиста і завантажте біт — згенеруємо лист під кожного.")
        : h("div", { key: "wrap", className: "space-y-3" }, [
            selected.length > 1 && h("div", {
              key: "bulk",
              className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3"
            }, [
              h("div", { key: "l", className: "text-sm text-purple-900" }, [
                h("span", { key: "b", className: "font-semibold" }, `Масове надсилання — ${pending.length}/${selected.length} адресатів`),
                h("span", { key: "s", className: "block text-xs text-purple-700/80 mt-0.5" }, "Один клік — і лист з бітом піде всім вибраним.")
              ]),
              h(PrimaryButton, {
                key: "b",
                onClick: handleBulkSend,
                pending: bulkSending,
                disabled: bulkSending || pending.length === 0
              }, bulkSending
                ? "Надсилаю…"
                : pending.length === 0
                  ? "Всім надіслано"
                  : `Надіслати всім (${pending.length})`
              )
            ]),
            h("div", { key: "list", className: "space-y-3" },
              selected.map((a) => h(MessageReview, {
                key: a.handle,
                artist: a,
                demo,
                forceSent: !!sentMap[a.handle],
                onSend: handleSent,
                onRemove: () => toggle(a.handle)
              }))
            )
          ])
    ])
  ]);
}

function StepCard({ n, title, active, children }) {
  return h("section", {
    className: `rounded-xl border bg-white shadow-sm p-5 transition-opacity ${
      active ? "border-zinc-$1 opacity-100" : "border-zinc-$1 opacity-60"
    }`
  }, [
    h("header", { key: "h", className: "flex items-center gap-3 mb-4" }, [
      h("span", {
        key: "n",
        className: `flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
          active ? "bg-purple-600 text-white" : "bg-zinc-$1 text-zinc-$1"
        }`
      }, n),
      h("h2", { key: "t", className: "text-base font-semibold text-zinc-$1" }, title)
    ]),
    h("div", { key: "b" }, children)
  ]);
}

Object.assign(window, { BeatOutreach });
