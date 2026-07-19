/**
 * Demo videos shown in the "What you can do on Flowstate" home section.
 *
 * ids verified against their YouTube titles:
 *   UCTMQQu6Nko = "deep research on flowstate"
 *   nLqg49b2wdA = "travel itinerary on flowstate"
 *   ipikB_yx1UY = "freelance projects on flowstate"
 *
 * The same set backs the marketing site's "Built for the power users" band
 * (public/landing/js/power-users.js) — keep the two in sync when adding a clip.
 */
export type UseCaseVideo = {
  key: string;
  title: string;
  tagline: string;
  youtubeId: string;
};

export const USE_CASE_VIDEOS: UseCaseVideo[] = [
  {
    key: "research",
    title: "Deep research",
    tagline: "Pull sources onto one board and ask across all of them",
    youtubeId: "UCTMQQu6Nko",
  },
  {
    key: "travel",
    title: "Travel itinerary",
    tagline: "Maps, budgets, and plans that update as you change your mind",
    youtubeId: "nLqg49b2wdA",
  },
  {
    key: "freelance",
    title: "Freelance projects",
    tagline: "Briefs, contracts, and deliverables in one shared space",
    youtubeId: "ipikB_yx1UY",
  },
];

/**
 * Poster frame for the un-played state — no channel name or avatar in it.
 * maxresdefault is the full-resolution frame; hqdefault is the guaranteed
 * fallback (see UseCaseVideoCard's onError).
 */
export const youtubePoster = (id: string) =>
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

export const youtubePosterFallback = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** The player is rendered at this size so YouTube serves a 1080p rendition, */
/** then scaled down to the card — otherwise a ~450px-wide player gets a soft */
/** low-res stream. */
export const YT_RENDER_W = 1920;
export const YT_RENDER_H = 1080;

/**
 * controls=0 + a click-guard overlay keeps YouTube's title bar (channel name
 * + avatar) hidden. Note `modestbranding`/`showinfo` are deprecated and no
 * longer do anything on their own — the guard is what actually does the work.
 */
export const youtubePlayUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}` +
  `?autoplay=1&rel=0&controls=0&modestbranding=1&vq=hd1080` +
  `&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;
