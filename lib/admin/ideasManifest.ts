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
