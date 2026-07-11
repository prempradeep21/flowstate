export type IdeaStatus = "Exploring" | "Prototype" | "Shipped";

export interface GroundbreakingIdea {
  slug: string;
  title: string;
  tagline: string;
  status: IdeaStatus;
  dateAdded: string;
  markdownPath: string;
  /** When set, Play navigates here; otherwise Play is disabled. */
  playgroundPath?: string;
}

export const GROUNDBREAKING_IDEAS: GroundbreakingIdea[] = [
  {
    slug: "conversation-to-flowstate-transfer",
    title: "Conversation to Flowstate Transfer",
    tagline:
      "Paste a transcript — get a branching conversation map with every link, video, and person already on the canvas.",
    status: "Exploring",
    dateAdded: "2026-06-30",
    markdownPath: "docs/admin/ideas/conversation-to-flowstate-transfer.md",
    playgroundPath:
      "/admin/ideas/conversation-to-flowstate-transfer/playground",
  },
  {
    slug: "canvas-pet-stickman",
    title: "Canvas Pet — Stickman",
    tagline:
      "A free-willed stickman that lives on the canvas — standing, running, and leaping between artifacts like footholds, at near-zero CPU cost.",
    status: "Prototype",
    dateAdded: "2026-07-03",
    markdownPath: "docs/admin/ideas/canvas-pet-stickman.md",
    playgroundPath: "/admin/ideas/canvas-pet-stickman/playground",
  },
];

export function getIdeaBySlug(slug: string): GroundbreakingIdea | undefined {
  return GROUNDBREAKING_IDEAS.find((idea) => idea.slug === slug);
}

export function getLabSummary(): {
  ideaCount: number;
  prototypeCount: number;
  playgroundCount: number;
} {
  return {
    ideaCount: GROUNDBREAKING_IDEAS.length,
    prototypeCount: GROUNDBREAKING_IDEAS.filter(
      (idea) => idea.status === "Prototype",
    ).length,
    playgroundCount: GROUNDBREAKING_IDEAS.filter(
      (idea) => idea.playgroundPath,
    ).length,
  };
}
