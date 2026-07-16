import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { buildCanvasSnapshot, type CanvasSnapshot } from "@/lib/canvasSnapshot";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  BAND_GAP_Y,
  BAND_LABEL_FONT_SIZE,
  BAND_LABEL_OFFSET_Y,
  boundsOfRects,
  centredColumn,
  COLUMN_STRIDE_X,
  HERO_LINE_FONT_SIZE,
  NODE_GAP_X,
  NODE_GAP_Y,
  rowPositions,
  SEED_CARD_POSITION,
  stackCentredOnAxis,
  STICKY_GAP_Y,
  TERRITORY_LINE_FONT_SIZE,
  viewportForBounds,
  ZONE_SUBTITLE_FONT_SIZE,
  ZONE_SUBTITLE_Y,
  ZONE_TITLE_FONT_SIZE,
  ZONE_TITLE_Y,
  ZONE_X,
  type Position,
  type Rect,
  type Size,
} from "@/lib/sampleCanvases/guinnessCampaign/layout";
import {
  CAMPAIGN_LINE,
  GUINNESS_CUT,
  GUINNESS_IDEA,
  GUINNESS_INPUT_BANDS,
  GUINNESS_MAKING,
  GUINNESS_OUTPUT,
  GUINNESS_SEED_CARD,
  GUINNESS_TERRITORIES,
  GUINNESS_ZONES,
  type CanvasColumn,
  type NodeSpec,
} from "@/lib/sampleCanvases/guinnessCampaign/data";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { MANUAL_STICKY_NOTE_SOURCE_CARD_ID } from "@/lib/stickyNoteArtifact";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasSkill,
  CanvasSkillNode,
  CanvasTextLabel,
  Card,
  Thread,
} from "@/lib/store";

/**
 * The Guinness campaign canvas — an agency **project** canvas.
 *
 * Not a research canvas and not built with the `research-canvas` skill: the
 * geometry is an hourglass (see ./layout.ts), because advertising converges on
 * one film and then explodes back out into cutdowns.
 *
 * Asset-node and skill-node composition follows `lib/buildMobileSdlcCanvas.ts`,
 * which is the precedent for mounting files shipped in `public/` onto a
 * code-defined canvas without any storage or auth context.
 */

const CANVAS_ID = "guinness-campaign";
const ROOT_CARD_ID = "guinness-card-root";
const THREAD_ID = "guinness-thread-main";
/** Skill nodes have no payload to measure — matches SDLC_SKILL_NODE_HEIGHT. */
const SKILL_NODE_SIZE = { w: 280, h: 120 };

export function buildGuinnessCampaignCanvas(): CanvasSnapshot {
  const threads: Record<string, Thread> = {
    [THREAD_ID]: { id: THREAD_ID, accentColour: THREAD_ACCENT_PALETTE[0]! },
  };
  const cards: Record<string, Card> = {
    [ROOT_CARD_ID]: {
      id: ROOT_CARD_ID,
      threadId: THREAD_ID,
      question: GUINNESS_SEED_CARD.question,
      answer: GUINNESS_SEED_CARD.answer,
      status: "done",
      position: SEED_CARD_POSITION,
      parentCardId: null,
      parentConversationId: null,
    },
  };

  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasAssets: Record<string, CanvasAsset> = {};
  const canvasAssetNodes: Record<string, CanvasAssetNode> = {};
  const canvasAssetOrder: string[] = [];
  const canvasSkills: Record<string, CanvasSkill> = {};
  const canvasSkillNodes: Record<string, CanvasSkillNode> = {};
  const canvasSkillOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];
  /**
   * What the canvas frames on open: the input zone, plus the seed card that sits
   * off to its left. The card carries the spec-pitch disclaimer and the "read it
   * left to right" instruction, so framing that excluded it would strand both
   * off-screen — which is exactly what the reader needs first.
   */
  const openingRects: Rect[] = [
    { x: SEED_CARD_POSITION.x, y: SEED_CARD_POSITION.y, w: 420, h: 200 },
  ];

  const addLabel = (
    key: string,
    text: string,
    position: Position,
    fontSize: number,
    width?: number,
  ) => {
    const id = `guinness-label-${key}`;
    canvasTextLabels[id] = { id, text, position, fontSize, width };
    canvasTextLabelOrder.push(id);
  };

  /** Asset for an asset spec — mirrors createSandboxAsset in the SDLC builder. */
  const assetFor = (spec: Extract<NodeSpec, { kind: "asset" }>): CanvasAsset => ({
    id: `guinness-asset-${spec.key}`,
    canvasId: CANVAS_ID,
    ownerId: "sample",
    name: spec.name,
    mimeType: spec.mimeType,
    sizeBytes: 0,
    storagePath: spec.publicUrl,
    publicUrl: spec.publicUrl,
    kind: spec.assetKind,
    createdAt: Date.now(),
  });

  const skillFor = (spec: Extract<NodeSpec, { kind: "skill" }>): CanvasSkill => ({
    id: `guinness-skill-${spec.key}`,
    canvasId: CANVAS_ID,
    ownerId: "sample",
    title: spec.title,
    fileName: spec.fileName,
    mimeType: "text/markdown",
    sizeBytes: 0,
    storagePath: spec.publicUrl,
    publicUrl: spec.publicUrl,
    createdAt: Date.now(),
  });

  /** Size a spec without placing it — needed to lay out before committing. */
  const sizeOf = (spec: NodeSpec): Size => {
    if (spec.kind === "asset") return getCanvasAssetBounds({}, assetFor(spec));
    if (spec.kind === "skill") return SKILL_NODE_SIZE;
    return getDefaultArtifactSize(
      payloadToArtifactKind(spec.payload),
      spec.payload,
    );
  };

  /** Place any node kind at a world position; returns the size used. */
  const place = (spec: NodeSpec, position: Position): Size => {
    const size = sizeOf(spec);

    if (spec.kind === "asset") {
      const asset = assetFor(spec);
      canvasAssets[asset.id] = asset;
      const nodeId = `guinness-node-${spec.key}`;
      canvasAssetNodes[nodeId] = { id: nodeId, assetId: asset.id, position, size };
      canvasAssetOrder.push(nodeId);
      return size;
    }

    if (spec.kind === "skill") {
      const skill = skillFor(spec);
      canvasSkills[skill.id] = skill;
      const nodeId = `guinness-node-${spec.key}`;
      canvasSkillNodes[nodeId] = { id: nodeId, skillId: skill.id, position };
      canvasSkillOrder.push(nodeId);
      return size;
    }

    const sourceCardId = spec.manualSticky
      ? MANUAL_STICKY_NOTE_SOURCE_CARD_ID
      : ROOT_CARD_ID;
    const artifact = createSessionArtifactFromPayload(spec.payload, sourceCardId);
    const stableId = `guinness-art-${spec.key}`;
    sessionArtifacts[stableId] = { ...artifact, id: stableId };

    const nodeId = `guinness-node-${spec.key}`;
    canvasArtifactNodes[nodeId] = {
      id: nodeId,
      artifactId: stableId,
      versionId: artifact.latestVersionId,
      sourceCardId,
      position,
      size,
    };
    canvasArtifactOrder.push(nodeId);
    return size;
  };

  /** A zone's heading + subtitle, on the shared header line. */
  const addZoneHeading = (key: string) => {
    const zone = GUINNESS_ZONES.find((z) => z.key === key);
    if (!zone) return;
    const x = ZONE_X[zone.key];
    addLabel(`${key}-title`, zone.title, { x, y: ZONE_TITLE_Y }, ZONE_TITLE_FONT_SIZE, 1600);
    addLabel(
      `${key}-sub`,
      zone.subtitle,
      { x, y: ZONE_SUBTITLE_Y },
      ZONE_SUBTITLE_FONT_SIZE,
      1200,
    );
  };

  /**
   * Lay out columns of items, each column centred on the y=0 axis.
   *
   * Advances by each column's real widest node rather than a fixed stride —
   * artifacts are not all one width (a table is 680, most things are 520), and
   * a fixed stride silently overlaps the next column.
   */
  const placeColumns = (columns: CanvasColumn[], originX: number): number => {
    let x = originX;
    for (const column of columns) {
      const sizes = column.items.map(sizeOf);
      const positions = centredColumn(sizes, x, NODE_GAP_Y);
      if (column.label) {
        const topY = positions[0]?.y ?? 0;
        addLabel(
          `col-${column.key}`,
          column.label,
          { x, y: topY + BAND_LABEL_OFFSET_Y - 24 },
          ZONE_SUBTITLE_FONT_SIZE,
          480,
        );
      }
      column.items.forEach((spec, j) => place(spec, positions[j]!));
      x += Math.max(...sizes.map((s) => s.w)) + NODE_GAP_X;
    }
    return x;
  };

  // --- zone 0: THE INPUT — category bands, the whole stack centred on y=0 ----
  addZoneHeading("input");
  {
    const bandHeights = GUINNESS_INPUT_BANDS.map((band) =>
      Math.max(...band.items.map((item) => sizeOf(item).h)),
    );
    const bandYs = stackCentredOnAxis(bandHeights, BAND_GAP_Y);

    GUINNESS_INPUT_BANDS.forEach((band, i) => {
      const bandY = bandYs[i]!;
      addLabel(
        `band-${band.key}`,
        band.label,
        { x: ZONE_X.input, y: bandY + BAND_LABEL_OFFSET_Y },
        BAND_LABEL_FONT_SIZE,
        1200,
      );
      const sizes = band.items.map(sizeOf);
      const positions = rowPositions(sizes, { x: ZONE_X.input, y: bandY }, NODE_GAP_X);
      band.items.forEach((spec, j) => {
        const size = place(spec, positions[j]!);
        openingRects.push({ ...positions[j]!, ...size });
      });
    });
  }

  // --- zone 1: TERRITORIES — three columns, each under its endline ----------
  addZoneHeading("territories");
  GUINNESS_TERRITORIES.forEach((territory, i) => {
    const x = ZONE_X.territories + i * COLUMN_STRIDE_X;
    const sizes = territory.items.map(sizeOf);
    // Territory columns are all ≤520 wide, so the fixed stride is safe here.
    const positions = centredColumn(sizes, x, STICKY_GAP_Y);
    const topY = positions[0]?.y ?? 0;
    addLabel(
      `terr-line-${territory.key}`,
      territory.line,
      { x, y: topY - 260 },
      TERRITORY_LINE_FONT_SIZE,
      520,
    );
    territory.items.forEach((spec, j) => place(spec, positions[j]!));
  });

  // --- zone 2: THE IDEA — the waist -----------------------------------------
  addZoneHeading("idea");
  {
    const sizes = GUINNESS_IDEA.map(sizeOf);
    const positions = centredColumn(sizes, ZONE_X.idea, NODE_GAP_Y);
    const topY = positions[0]?.y ?? 0;
    // The chosen endline, set huge. This is the hero moment of the canvas.
    addLabel(
      "hero-line",
      CAMPAIGN_LINE,
      { x: ZONE_X.idea, y: topY - 520 },
      HERO_LINE_FONT_SIZE,
      1600,
    );
    GUINNESS_IDEA.forEach((spec, j) => place(spec, positions[j]!));
  }

  // --- zones 3-5 -------------------------------------------------------------
  addZoneHeading("making");
  placeColumns(GUINNESS_MAKING, ZONE_X.making);

  addZoneHeading("cut");
  placeColumns(GUINNESS_CUT, ZONE_X.cut);

  addZoneHeading("output");
  placeColumns(GUINNESS_OUTPUT, ZONE_X.output);

  // Open framed on the seed card + input zone, then the user walks right.
  const bounds = boundsOfRects(openingRects);
  const viewport = bounds
    ? viewportForBounds(bounds, 0.32, 120)
    : { x: 0, y: 0, scale: 1 };

  return buildCanvasSnapshot({
    viewport,
    cards,
    cardOrder: [ROOT_CARD_ID],
    connections: [],
    threads,
    threadOrder: [THREAD_ID],
    groups: {},
    connectorStyle: "curvy",
    canvasBackgroundStyle: "grid",
    canvasTheme: "dark",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasAssets,
    canvasAssetNodes,
    canvasAssetOrder,
    canvasSkills,
    canvasSkillNodes,
    canvasSkillOrder,
    canvasTextLabels,
    canvasTextLabelOrder,
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}
