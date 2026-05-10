import type { ReactElement } from "react";
import type { ProspectContacts } from "@/src/lib/beatProspects";

/**
 * One contact channel (Instagram, Telegram, Email, …) with everything we
 * need to render it and to open it in a deep link.
 *
 * `buildHref` receives the raw contact value the AI / user provided
 * (handle, username, URL, email, phone) plus the message we want to send,
 * and returns a navigable URL for the user's browser / OS to open.
 *
 * `prefillsMessage` flags whether the link will arrive at the destination
 * with the message body already prefilled. When false, the UI silently
 * copies the message to the clipboard before navigating so the user can
 * paste it.
 */
export interface ChannelDef {
  key: ChannelKey;
  label: string;
  hint: string;
  prefillsMessage: boolean;
  buildHref: (value: string, message?: { subject: string; body: string }) => string;
  Icon: ChannelIcon;
}

export type ChannelKey =
  | "email"
  | "phone"
  | "website"
  | "instagram"
  | "soundcloud"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "spotify"
  | "beatstars"
  | "telegram"
  | "discord"
  | "whatsapp";

type ChannelIcon = (props: { className?: string }) => ReactElement;

// ---------- helpers ----------

function trimAt(value: string): string {
  return value.replace(/^@+/, "").trim();
}

function ensureUrl(value: string, fallbackHost: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return `https://${fallbackHost}${v}`;
  return `https://${fallbackHost}/${trimAt(v)}`;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function asMailto(value: string, message?: { subject: string; body: string }): string {
  const trimmed = value.trim();
  if (!message) return `mailto:${trimmed}`;
  const params = new URLSearchParams({
    subject: message.subject,
    body: message.body,
  });
  return `mailto:${trimmed}?${params.toString()}`;
}

// ---------- icons ----------

const iconCommonProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
} as const;

const EmailIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v.378l-9.75 5.65L2.25 7.128V6.75Z" />
    <path d="M21.75 8.873v8.377A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V8.873l9.378 5.434a.75.75 0 0 0 .744 0l9.378-5.434Z" />
  </svg>
);

const PhoneIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" />
  </svg>
);

const WebsiteIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5c-.04.04-.078.082-.115.124a.75.75 0 0 0 .997 1.123 2.25 2.25 0 0 1 3.082-.012l1.561 1.561a2.25 2.25 0 0 1-.012 3.082.75.75 0 0 0 1.123.997l.124-.115 4.5-4.5a3.75 3.75 0 0 0 0-5.304l-1.456-1.456ZM4.098 19.902a3.75 3.75 0 0 0 5.304 0l4.5-4.5c.04-.04.078-.082.115-.124a.75.75 0 1 0-.997-1.123 2.25 2.25 0 0 1-3.082.012l-1.561-1.561a2.25 2.25 0 0 1 .012-3.082.75.75 0 0 0-1.123-.997l-.124.115-4.5 4.5a3.75 3.75 0 0 0 0 5.304l1.456 1.456Z"
    />
  </svg>
);

const InstagramIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.25c-2.717 0-3.056.012-4.123.06-1.064.05-1.79.218-2.426.465a4.902 4.902 0 0 0-1.772 1.153A4.902 4.902 0 0 0 2.526 5.7c-.247.636-.416 1.363-.465 2.426C2.012 9.194 2 9.533 2 12.25s.012 3.056.06 4.123c.05 1.064.218 1.79.465 2.426a4.902 4.902 0 0 0 1.153 1.772 4.902 4.902 0 0 0 1.772 1.153c.636.247 1.363.416 2.426.465 1.067.048 1.406.06 4.123.06s3.056-.012 4.123-.06c1.064-.05 1.79-.218 2.426-.465a4.902 4.902 0 0 0 1.772-1.153 4.902 4.902 0 0 0 1.153-1.772c.247-.636.416-1.363.465-2.426.048-1.067.06-1.406.06-4.123s-.012-3.056-.06-4.123c-.05-1.064-.218-1.79-.465-2.426a4.902 4.902 0 0 0-1.153-1.772A4.902 4.902 0 0 0 18.7 2.776c-.636-.247-1.363-.416-2.426-.465-1.067-.048-1.406-.06-4.123-.06ZM12 7.378a4.872 4.872 0 1 0 0 9.744 4.872 4.872 0 0 0 0-9.744Zm0 8.034a3.162 3.162 0 1 1 0-6.324 3.162 3.162 0 0 1 0 6.324Zm5.06-8.225a1.137 1.137 0 1 0 0-2.275 1.137 1.137 0 0 0 0 2.275Z"
    />
  </svg>
);

const SoundCloudIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M0.5 14.5c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-3c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v3Zm2 1c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-5c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v5Zm2 0.5c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-7c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v7Zm2 0c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5v-9c0-0.276-0.224-0.5-0.5-0.5s-0.5 0.224-0.5 0.5v9Zm2 0c0 0.276 0.224 0.5 0.5 0.5s0.5-0.224 0.5-0.5V6c0-0.276-0.224-0.5-0.5-0.5S9 5.724 9 6v10ZM11 16c0 0.552 0.448 1 1 1h11c0.552 0 1-0.448 1-1V9c0-0.552-0.448-1-1-1h-11c-0.552 0-1 0.448-1 1v7Z" />
  </svg>
);

const YouTubeIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814ZM10 15.464V8.536L15.928 12 10 15.464Z"
    />
  </svg>
);

const TikTokIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M19.5 7.94a7.36 7.36 0 0 1-4.31-1.39v6.27a5.74 5.74 0 1 1-4.95-5.69v3.16a2.62 2.62 0 1 0 1.83 2.5V2h3.13a4.31 4.31 0 0 0 4.3 4.3v1.64Z" />
  </svg>
);

const TwitterIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M18.244 2H21l-6.522 7.45L22 22h-6.844l-4.78-6.25L4.8 22H2l6.97-7.967L2 2h6.998l4.32 5.713L18.244 2Zm-1.2 18.354h1.518L7.066 3.566H5.44l11.604 16.788Z" />
  </svg>
);

const SpotifyIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.586 14.424a.625.625 0 0 1-.86.207c-2.353-1.438-5.314-1.764-8.802-.967a.625.625 0 1 1-.279-1.219c3.815-.872 7.087-.494 9.733 1.12.296.182.39.567.208.86Zm1.224-2.722a.781.781 0 0 1-1.075.258c-2.694-1.656-6.802-2.135-9.99-1.169a.781.781 0 0 1-.456-1.494c3.642-1.107 8.166-.572 11.262 1.33a.781.781 0 0 1 .26 1.075Zm.105-2.834c-3.231-1.92-8.561-2.097-11.646-1.16a.937.937 0 1 1-.546-1.794c3.541-1.078 9.428-.87 13.149 1.343a.937.937 0 1 1-.957 1.611Z"
    />
  </svg>
);

const BeatStarsIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m12 1.75 2.943 5.964 6.582.957-4.762 4.643 1.124 6.555L12 16.764l-5.886 3.105 1.124-6.555L2.476 8.671l6.582-.957L12 1.75Zm0 4.523-1.836 3.72-4.106.597 2.971 2.897-.701 4.09L12 15.643l3.672 1.934-.701-4.09 2.971-2.897-4.106-.597L12 6.273Z"
    />
  </svg>
);

const TelegramIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

const DiscordIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path d="M19.27 5.33A19.6 19.6 0 0 0 14.4 4l-.24.5a18.07 18.07 0 0 0-4.31 0L9.6 4a19.6 19.6 0 0 0-4.87 1.33C2.18 8.96 1.5 12.5 1.84 15.99c1.53 1.13 3.21 1.95 4.95 2.51l.42-.69c-.86-.32-1.69-.71-2.46-1.18l.45-.27c1.16.55 2.42.92 3.7 1.06.16 0 .32-.03.46-.1.05.06.1.13.16.19a17.83 17.83 0 0 0 6.83 0c.06-.06.11-.13.16-.19.14.07.3.1.46.1 1.28-.14 2.54-.5 3.7-1.06l.45.27c-.77.47-1.6.86-2.46 1.18l.42.69c1.74-.56 3.42-1.38 4.95-2.51.4-3.49-.27-7.03-2.78-10.66ZM8.51 14c-.93 0-1.7-.85-1.7-1.9s.76-1.9 1.7-1.9c.95 0 1.71.86 1.7 1.9 0 1.05-.76 1.9-1.7 1.9Zm6.97 0c-.94 0-1.71-.85-1.71-1.9s.77-1.9 1.71-1.9c.95 0 1.71.86 1.7 1.9 0 1.05-.75 1.9-1.7 1.9Z" />
  </svg>
);

const WhatsAppIcon: ChannelIcon = ({ className = "w-4 h-4" }) => (
  <svg {...iconCommonProps} className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.05 4.91A9.96 9.96 0 0 0 12.04 2C6.55 2 2.07 6.46 2.07 11.95c0 1.76.46 3.47 1.34 4.99L2 22l5.18-1.36a9.96 9.96 0 0 0 4.86 1.24c5.49 0 9.97-4.46 9.97-9.95 0-2.66-1.04-5.16-2.96-7.02ZM12.04 20.13a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.07.81.82-3-.2-.31a8.18 8.18 0 1 1 6.91 3.82Zm4.49-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.28.37-.42.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.59 4.11 3.63.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28Z"
    />
  </svg>
);

// ---------- channel registry ----------

export const CHANNELS: Record<ChannelKey, ChannelDef> = {
  email: {
    key: "email",
    label: "Email",
    hint: "mailto: відкриває поштовий клієнт із заповненою темою та текстом",
    prefillsMessage: true,
    buildHref: (value, message) => asMailto(value, message),
    Icon: EmailIcon,
  },
  phone: {
    key: "phone",
    label: "Телефон",
    hint: "tel: для дзвінка",
    prefillsMessage: false,
    buildHref: (value) => `tel:${digitsOnly(value)}`,
    Icon: PhoneIcon,
  },
  website: {
    key: "website",
    label: "Сайт",
    hint: "Відкриває особистий сайт артиста",
    prefillsMessage: false,
    buildHref: (value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`),
    Icon: WebsiteIcon,
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    hint: "Відкриває профіль (DM-prefill не підтримується — текст у буфері)",
    prefillsMessage: false,
    buildHref: (value) =>
      /^https?:\/\//i.test(value)
        ? value
        : `https://instagram.com/${trimAt(value)}`,
    Icon: InstagramIcon,
  },
  soundcloud: {
    key: "soundcloud",
    label: "SoundCloud",
    hint: "Відкриває профіль (DM через клік на «Message» там)",
    prefillsMessage: false,
    buildHref: (value) => ensureUrl(value, "soundcloud.com"),
    Icon: SoundCloudIcon,
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    hint: "Відкриває канал (контакт через email на About)",
    prefillsMessage: false,
    buildHref: (value) => {
      const v = value.trim();
      if (/^https?:\/\//i.test(v)) return v;
      const handle = trimAt(v).replace(/^@?/, "@");
      return `https://youtube.com/${handle}`;
    },
    Icon: YouTubeIcon,
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    hint: "Відкриває профіль",
    prefillsMessage: false,
    buildHref: (value) => {
      const v = value.trim();
      if (/^https?:\/\//i.test(v)) return v;
      return `https://tiktok.com/@${trimAt(v)}`;
    },
    Icon: TikTokIcon,
  },
  twitter: {
    key: "twitter",
    label: "X / Twitter",
    hint: "Відкриває профіль або compose-DM, якщо знаємо ID",
    prefillsMessage: false,
    buildHref: (value) => {
      const v = value.trim();
      if (/^https?:\/\//i.test(v)) return v;
      return `https://twitter.com/${trimAt(v)}`;
    },
    Icon: TwitterIcon,
  },
  spotify: {
    key: "spotify",
    label: "Spotify",
    hint: "Сторінка артиста (без DM)",
    prefillsMessage: false,
    buildHref: (value) => {
      const v = value.trim();
      if (/^https?:\/\//i.test(v)) return v;
      return `https://open.spotify.com/search/${encodeURIComponent(trimAt(v))}`;
    },
    Icon: SpotifyIcon,
  },
  beatstars: {
    key: "beatstars",
    label: "BeatStars",
    hint: "Профіль артиста на BeatStars",
    prefillsMessage: false,
    buildHref: (value) => ensureUrl(value, "beatstars.com"),
    Icon: BeatStarsIcon,
  },
  telegram: {
    key: "telegram",
    label: "Telegram",
    hint: "Відкриває чат через t.me/<handle>",
    prefillsMessage: false,
    buildHref: (value) => {
      const v = value.trim();
      if (/^https?:\/\//i.test(v)) return v;
      return `https://t.me/${trimAt(v)}`;
    },
    Icon: TelegramIcon,
  },
  discord: {
    key: "discord",
    label: "Discord",
    hint: "Юзернейм для пошуку у Discord (DM-deep-link не підтримується)",
    prefillsMessage: false,
    buildHref: (value) => `https://discord.com/users/${trimAt(value)}`,
    Icon: DiscordIcon,
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    hint: "wa.me з prefill повідомлення",
    prefillsMessage: true,
    buildHref: (value, message) => {
      const phone = digitsOnly(value).replace(/^\+/, "");
      const base = `https://wa.me/${phone}`;
      if (!message) return base;
      return `${base}?text=${encodeURIComponent(`${message.subject}\n\n${message.body}`)}`;
    },
    Icon: WhatsAppIcon,
  },
};

export const CHANNEL_ORDER: ChannelKey[] = [
  "email",
  "instagram",
  "telegram",
  "whatsapp",
  "soundcloud",
  "youtube",
  "tiktok",
  "twitter",
  "beatstars",
  "spotify",
  "discord",
  "phone",
  "website",
];

/**
 * Walk a `ProspectContacts` blob and return only the channels that have a
 * truthy value, in canonical display order.
 */
export function getAvailableChannels(
  contacts: ProspectContacts | null | undefined
): { def: ChannelDef; value: string }[] {
  if (!contacts) return [];
  const out: { def: ChannelDef; value: string }[] = [];
  for (const key of CHANNEL_ORDER) {
    const raw = contacts[key];
    if (typeof raw === "string" && raw.trim()) {
      out.push({ def: CHANNELS[key], value: raw.trim() });
    }
  }
  return out;
}

/**
 * Lossy parse: accept anything Prisma `Json` may have stored, hand back a
 * cleaned `ProspectContacts` (or null when the value is unusable).
 */
export function parseContacts(value: unknown): ProspectContacts | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const out: ProspectContacts = {};
  for (const key of CHANNEL_ORDER) {
    const raw = v[key];
    if (typeof raw === "string" && raw.trim()) out[key] = raw.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}
