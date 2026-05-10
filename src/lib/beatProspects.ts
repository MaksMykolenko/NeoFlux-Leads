/**
 * Shape of an artist prospect that the BeatOutreach UI works with.
 *
 * Real prospects are produced live by `searchBeatProspects` (see
 * `src/actions/beatActions.ts`), which calls Gemini with Google Search
 * grounding to discover active artists across SoundCloud, YouTube,
 * Instagram, BeatStars, etc. We intentionally keep `platform` as an open
 * string here — the AI may return platforms we don't enumerate ahead of
 * time and the UI just renders the label.
 */
export interface BeatProspect {
  handle: string;
  realName: string;
  genre: string;
  platform: string;
  followers: number;
  email: string | null;
  lookingForType: boolean;
  profileUrl: string | null;
  contacts: ProspectContacts;
}

/**
 * All contact channels the model could discover for a single artist.
 *
 * Every field is optional and stores either:
 *   - a full URL (e.g. SoundCloud / YouTube profile),
 *   - a `@handle` or username (Instagram, TikTok, Twitter, Discord, Telegram),
 *   - or a raw value (email, phone).
 *
 * The `channels` lib normalizes these into clickable deep links at render time.
 */
export interface ProspectContacts {
  email?: string | null;
  phone?: string | null;
  website?: string | null;

  instagram?: string | null;
  soundcloud?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  spotify?: string | null;
  beatstars?: string | null;

  telegram?: string | null;
  discord?: string | null;
  whatsapp?: string | null;
}
