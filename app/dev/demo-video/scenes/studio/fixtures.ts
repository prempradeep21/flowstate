import { getStudioPool, type StudioArtifact, type StudioCardItem } from "@/lib/artifactStudio/pool";
import { seededRandom } from "@/lib/artifactStudio/selection";
import type { StyleFamilyId } from "@/components/artifactStyles/types";

/**
 * Studio scenes — a 9:16 bento of real Artifact Studio artifacts, one scene
 * per style family. The cast is pulled from the studio pool by uid, laid out
 * on a 1000px-wide world grid in rows, and the last row is the empty Q&A
 * composer the closing beat types into.
 */

export const STUDIO_SCENE_IDS = ["studio-d", "studio-capsule"] as const;
export type StudioSceneId = (typeof STUDIO_SCENE_IDS)[number];

/** Frame size the scene is composed for (9:16). */
export const FRAME = { w: 1080, h: 1920 } as const;

/** World grid. */
export const GRID_W = 1000;
export const GAP = 24;
export const COL = (GRID_W - GAP) / 2; // 488

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneTile extends WorldRect {
  uid: string;
  item: StudioArtifact;
  /** Alignment order (row-major) — drives the stagger of the bento snap. */
  order: number;
  /** Exploded offset before the grid aligns (world px, degrees). */
  scatter: { dx: number; dy: number; rot: number };
}

interface RowSpec {
  h: number;
  /** uids with their widths; widths that sum (with gaps) to GRID_W. */
  cells: { uid: string; w: number }[];
}

export interface StudioSceneSpec {
  id: StudioSceneId;
  familyId: StyleFamilyId;
  themeId: string | null;
  /** The pool Q&A card the closing beat is built from. */
  qaUid: string;
  question: string;
  answer: string;
  /** The artifact that pops out as the answer. */
  popUid: string;
  rows: RowSpec[];
  /** Solid colour standing in for the family backdrop in overlays. */
  fieldColor: string;
}

const QA_W = 640;
const COMPOSER_H = 64;

export const SPECS: Record<StudioSceneId, StudioSceneSpec> = {
  "studio-d": {
    id: "studio-d",
    familyId: "style-d",
    themeId: null,
    qaUid: "airbnb/abnb-card-root",
    question: "Where does Airbnb's revenue actually come from?",
    answer:
      "Mostly North America and EMEA — **$5.2B** and **$4.7B** of the $12.2B in FY2025 — with Latin America and Asia Pacific under $1.2B each. Here's the split.",
    popUid: "airbnb/abnb-art-chart-revenue-region",
    fieldColor: "#E6E6E4",
    rows: [
      { h: 280, cells: [{ uid: "lightcone-emergent|What the software used to cost", w: COL }, { uid: "yc-interview|Gross margin / take rate", w: COL }] },
      { h: 392, cells: [{ uid: "airbnb/abnb-art-chart-nights", w: COL }, { uid: "airbnb/abnb-art-chart-revenue", w: COL }] },
      { h: 356, cells: [{ uid: "airbnb/abnb-art-table-key-metrics", w: GRID_W }] },
      { h: 360, cells: [{ uid: "emergent/emg-art-gauge-deploy", w: COL }, { uid: "yc-interview|Numbers to walk in with", w: COL }] },
      { h: 236, cells: [{ uid: "lightcone-emergent|How they ended up building for non-technical users", w: GRID_W }] },
    ],
  },
  "studio-capsule": {
    id: "studio-capsule",
    familyId: "capsule",
    themeId: "peach",
    qaUid: "guinness-campaign/guinness-card-root",
    question: "How is the media budget split across channels?",
    answer:
      "TV and BVOD take the biggest share at **38%**, then social at **24%**. Out-of-home, cinema and audio make up the rest — here's the split.",
    popUid: "guinness-campaign/guinness-art-channel-split",
    fieldColor: "#F8F1EA",
    rows: [
      { h: 300, cells: [{ uid: "guinness-campaign/guinness-art-budget-burn", w: COL }, { uid: "guinness-campaign/guinness-art-moodboard", w: COL }] },
      { h: 380, cells: [{ uid: "guinness-campaign/guinness-art-deliverables-matrix", w: GRID_W }] },
      { h: 420, cells: [{ uid: "guinness-campaign/guinness-art-shoot-calendar", w: COL }, { uid: "guinness-campaign/guinness-art-clearances", w: COL }] },
      {
        h: 300,
        cells: [
          { uid: "guinness-campaign/guinness-art-note-gap", w: 240 },
          { uid: "guinness-campaign/guinness-art-note-agegate", w: 240 },
          { uid: "guinness-campaign/guinness-art-script", w: GRID_W - 480 - GAP * 2 },
        ],
      },
      { h: 280, cells: [{ uid: "guinness-campaign/guinness-art-timeline", w: GRID_W }] },
    ],
  },
};

export interface StudioLayout {
  tiles: SceneTile[];
  /** The composer's slot — the Q&A card grows down from its top edge. */
  composer: WorldRect;
  /** Grid bounds (world). */
  bounds: WorldRect;
  qa: StudioCardItem;
  pop: StudioArtifact;
  /** The pop-out artifact's box, below the finished card. */
  popSize: { w: number; h: number };
}

const poolByUid = (() => {
  let cache: Map<string, StudioArtifact> | null = null;
  return () => {
    if (!cache) cache = new Map(getStudioPool().map((a) => [a.uid, a]));
    return cache;
  };
})();

/**
 * `slug/id`, or `slug|title` for transcript-import artifacts, whose ids are
 * minted per build and cannot be pinned.
 */
function mustGet(key: string): StudioArtifact {
  const byUid = poolByUid().get(key);
  if (byUid) return byUid;
  const bar = key.indexOf("|");
  if (bar > 0) {
    const slug = key.slice(0, bar);
    const title = key.slice(bar + 1);
    const byTitle = getStudioPool().find((a) => a.uid.startsWith(`${slug}/`) && a.artifact.title === title);
    if (byTitle) return byTitle;
  }
  throw new Error(`studio scene: "${key}" is not in the studio pool`);
}

const layoutCache = new Map<StudioSceneId, StudioLayout>();

/** The scene's cast and world layout — built once, pure. */
export function getStudioLayout(id: StudioSceneId): StudioLayout {
  const cached = layoutCache.get(id);
  if (cached) return cached;
  const spec = SPECS[id];
  const tiles: SceneTile[] = [];
  let y = 0;
  let order = 0;
  for (const row of spec.rows) {
    let x = 0;
    for (const cell of row.cells) {
      const rand = seededRandom(`${id}:${cell.uid}`);
      tiles.push({
        uid: cell.uid,
        item: mustGet(cell.uid),
        x,
        y,
        w: cell.w,
        h: row.h,
        order: order++,
        scatter: {
          dx: (rand() - 0.5) * 2 * 110,
          dy: (rand() - 0.5) * 2 * 80,
          rot: (rand() - 0.5) * 2 * 4.5,
        },
      });
      x += cell.w + GAP;
    }
    y += row.h + GAP;
  }
  const composer = { x: (GRID_W - QA_W) / 2, y, w: QA_W, h: COMPOSER_H };
  const bounds = { x: 0, y: 0, w: GRID_W, h: y + COMPOSER_H };

  const base = mustGet(spec.qaUid);
  if (!base.card) throw new Error(`studio scene: "${spec.qaUid}" is not a Q&A card`);
  const qa: StudioCardItem = {
    ...base,
    artifact: { ...base.artifact, title: spec.question },
    payload: { type: "qa", title: spec.question, data: { heading: spec.question, body: spec.answer } },
    card: { ...base.card, question: spec.question, answer: spec.answer },
    natural: { w: QA_W, h: base.natural.h },
  };
  const pop = mustGet(spec.popUid);
  const popSize = { w: QA_W, h: Math.round((QA_W * pop.natural.h) / pop.natural.w) };

  const layout = { tiles, composer, bounds, qa, pop, popSize };
  layoutCache.set(id, layout);
  return layout;
}
