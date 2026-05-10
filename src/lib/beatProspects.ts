/**
 * Seed catalogue of artist prospects shown in the BeatOutreach search step.
 *
 * Real platform scraping (SoundCloud / YouTube / Instagram) requires per-platform
 * API keys, OAuth, and ToS-compliant pagination — out of scope for the first
 * iteration. Until that's wired up, this seed list lets the producer trial the
 * end-to-end flow against realistic-looking data.
 */
export interface BeatProspect {
  handle: string;
  realName: string;
  genre: string;
  platform: "SoundCloud" | "YouTube" | "Instagram";
  followers: number;
  email: string | null;
  lookingForType: boolean;
  profileUrl: string | null;
}

export const BEAT_PROSPECTS: BeatProspect[] = [
  {
    handle: "@youngluna.beats",
    realName: "Артем Луна",
    genre: "Trap / Drill",
    platform: "SoundCloud",
    followers: 4200,
    email: "luna.beats@gmail.com",
    lookingForType: true,
    profileUrl: "https://soundcloud.com/youngluna",
  },
  {
    handle: "@kyivflow",
    realName: "MC Kyivflow",
    genre: "Hip-Hop",
    platform: "YouTube",
    followers: 12400,
    email: "booking@kyivflow.ua",
    lookingForType: true,
    profileUrl: "https://youtube.com/@kyivflow",
  },
  {
    handle: "@meri.rnb",
    realName: "Meri",
    genre: "R&B / Pop",
    platform: "Instagram",
    followers: 27800,
    email: null,
    lookingForType: false,
    profileUrl: "https://instagram.com/meri.rnb",
  },
  {
    handle: "@nightowl.flow",
    realName: "Night Owl",
    genre: "Drill / Phonk",
    platform: "SoundCloud",
    followers: 8100,
    email: "nightowl.contact@gmail.com",
    lookingForType: true,
    profileUrl: "https://soundcloud.com/nightowl-flow",
  },
  {
    handle: "@kosmo.808",
    realName: "Kosmo",
    genre: "Trap",
    platform: "YouTube",
    followers: 5600,
    email: "kosmo808@proton.me",
    lookingForType: true,
    profileUrl: "https://youtube.com/@kosmo808",
  },
  {
    handle: "@vira.melodic",
    realName: "Віра",
    genre: "Melodic Trap",
    platform: "Instagram",
    followers: 19200,
    email: "vira.melodic@gmail.com",
    lookingForType: true,
    profileUrl: "https://instagram.com/vira.melodic",
  },
];

export function searchProspects(query: string): BeatProspect[] {
  const q = query.trim().toLowerCase();
  if (!q) return BEAT_PROSPECTS;
  const matches = BEAT_PROSPECTS.filter(
    (a) =>
      a.handle.toLowerCase().includes(q) ||
      a.genre.toLowerCase().includes(q) ||
      a.realName.toLowerCase().includes(q) ||
      a.platform.toLowerCase().includes(q)
  );
  return matches.length ? matches : BEAT_PROSPECTS;
}
