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
}
