import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";

export const SDLC_SANDBOX_SOURCE_CARD_ID = "sdlc-sandbox-root";
export const SDLC_SANDBOX_CANVAS_ID = "mobile-sdlc-sandbox";

export interface SdlcPhase {
  id: string;
  label: string;
  subtitle: string;
  originX: number;
  threadColorIndex: number;
  guidanceNote: string;
}

const ZONE_WIDTH = 520;
const ZONE_GAP = 720;
const ZONE_ORIGIN_X = 160;

export const SDLC_PHASES: SdlcPhase[] = [
  {
    id: "charter",
    label: "0 — Charter",
    subtitle: "PRD, competitive landscape, business case",
    originX: ZONE_ORIGIN_X,
    threadColorIndex: 0,
    guidanceNote:
      "Paste your PRD (Google Doc or PDF). Prefer Google Sheets URLs over local .xlsx for AI context when plugged.",
  },
  {
    id: "discovery",
    label: "1 — Discovery",
    subtitle: "Research, personas, problem framing",
    originX: ZONE_ORIGIN_X + (ZONE_WIDTH + ZONE_GAP),
    threadColorIndex: 1,
    guidanceNote:
      "Drop interview audio, persona decks, and research notes. Branch parallel hypotheses from here.",
  },
  {
    id: "design",
    label: "2 — Design",
    subtitle: "Figma, wireframes, design system",
    originX: ZONE_ORIGIN_X + 2 * (ZONE_WIDTH + ZONE_GAP),
    threadColorIndex: 2,
    guidanceNote:
      "Paste Figma share links (not .fig exports). Drop wireframe screenshots as image assets.",
  },
  {
    id: "build",
    label: "3 — Build",
    subtitle: "Repo, backlog, API spec, architecture",
    originX: ZONE_ORIGIN_X + 3 * (ZONE_WIDTH + ZONE_GAP),
    threadColorIndex: 3,
    guidanceNote:
      "Link the GitHub repo and sprint backlog. Keep API specs as JSON or OpenAPI files.",
  },
  {
    id: "quality",
    label: "4 — Quality",
    subtitle: "Test plans, beta feedback, review guidelines",
    originX: ZONE_ORIGIN_X + 4 * (ZONE_WIDTH + ZONE_GAP),
    threadColorIndex: 4,
    guidanceNote:
      "Attach QA test plans (PDF) and beta feedback trackers. Jira/Linear links work as website previews.",
  },
  {
    id: "ship",
    label: "5 — Ship & Learn",
    subtitle: "Release checklist, KPIs, store listing",
    originX: ZONE_ORIGIN_X + 5 * (ZONE_WIDTH + ZONE_GAP),
    threadColorIndex: 5,
    guidanceNote:
      "Track release milestones and post-launch KPIs. Plug the SDLC skill into phase questions later.",
  },
];

export function sdlcThreadId(phaseId: string): string {
  return `sdlc-phase-${phaseId}`;
}

export function sdlcThreadAccent(index: number): string {
  return THREAD_ACCENT_PALETTE[index % THREAD_ACCENT_PALETTE.length]!;
}

export const SDLC_INPUT_START_Y = 816;
export const SDLC_LABEL_Y = 72;
export const SDLC_GUIDANCE_Y = 360;
export const SDLC_INPUT_GAP_Y = 264;
/** Extra vertical room for skill nodes (shorter than most artifacts). */
export const SDLC_SKILL_NODE_HEIGHT = 120;
