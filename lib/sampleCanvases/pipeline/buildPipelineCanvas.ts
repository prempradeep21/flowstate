import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { buildCanvasSnapshot, type CanvasSnapshot } from "@/lib/canvasSnapshot";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  boundsOfRects,
  centredColumn,
  COLUMN_LABEL_FONT_SIZE,
  COLUMN_LABEL_OFFSET_Y,
  NODE_GAP_X,
  NODE_GAP_Y,
  viewportForBounds,
  ZONE_SUBTITLE_FONT_SIZE,
  ZONE_SUBTITLE_Y,
  ZONE_TITLE_FONT_SIZE,
  ZONE_TITLE_Y,
  type Position,
  type Rect,
  type Size,
} from "@/lib/sampleCanvases/pipeline/pipelineLayout";
import type { ArtifactSpec, Zone } from "@/lib/sampleCanvases/pipeline/content";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { MANUAL_STICKY_NOTE_SOURCE_CARD_ID } from "@/lib/stickyNoteArtifact";
import type {
  CanvasArtifactNode,
  CanvasTextLabel,
  Card,
  Thread,
} from "@/lib/store";

/** A node placed by hand at an explicit position (e.g. the master timeline). */
export interface StandalonePlacement {
  spec: ArtifactSpec;
  position: Position;
}

export interface PipelineCanvasConfig {
  /** Stable id prefix for every node/artifact/label, e.g. "vienna". */
  idPrefix: string;
  seed: { question: string; answer: string };
  seedPosition: Position;
  /** World-x origin of each zone, keyed by zone key. */
  zoneX: Record<string, number>;
  zones: Zone[];
  /** Hand-placed nodes (the master timeline sits above the pipeline). */
  standalone?: StandalonePlacement[];
  /** Index into THREAD_ACCENT_PALETTE. */
  accentIndex?: number;
  canvasTheme?: "light" | "dark";
  /** Opening viewport scale — pick so the first zone lands within ~1280px. */
  openingScale?: number;
}

/**
 * Builds a `kind:"project"` filmmaker pipeline canvas from a data-only config.
 * Assembly mirrors `lib/sampleCanvases/guinnessCampaign/buildGuinnessCampaignCanvas.ts`;
 * the difference is the geometry (a straight left-to-right pipeline, not an
 * hourglass) and that every node is an artifact.
 */
export function buildPipelineCanvas(config: PipelineCanvasConfig): CanvasSnapshot {
  const {
    idPrefix,
    seed,
    seedPosition,
    zoneX,
    zones,
    standalone = [],
    accentIndex = 0,
    canvasTheme = "dark",
    openingScale = 0.3,
  } = config;

  const ROOT_CARD_ID = `${idPrefix}-card-root`;
  const THREAD_ID = `${idPrefix}-thread-main`;

  const threads: Record<string, Thread> = {
    [THREAD_ID]: {
      id: THREAD_ID,
      accentColour:
        THREAD_ACCENT_PALETTE[accentIndex % THREAD_ACCENT_PALETTE.length]!,
    },
  };
  const cards: Record<string, Card> = {
    [ROOT_CARD_ID]: {
      id: ROOT_CARD_ID,
      threadId: THREAD_ID,
      question: seed.question,
      answer: seed.answer,
      status: "done",
      position: seedPosition,
      parentCardId: null,
      parentConversationId: null,
    },
  };

  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];

  const addLabel = (
    key: string,
    text: string,
    position: Position,
    fontSize: number,
    width?: number,
  ) => {
    const id = `${idPrefix}-label-${key}`;
    canvasTextLabels[id] = { id, text, position, fontSize, width };
    canvasTextLabelOrder.push(id);
  };

  const sizeOf = (spec: ArtifactSpec): Size =>
    getDefaultArtifactSize(payloadToArtifactKind(spec.payload), spec.payload);

  /** Place one artifact at a world position; returns its rect. */
  const place = (spec: ArtifactSpec, position: Position): Rect => {
    const size = sizeOf(spec);
    const sourceCardId = spec.manualSticky
      ? MANUAL_STICKY_NOTE_SOURCE_CARD_ID
      : ROOT_CARD_ID;
    const artifact = createSessionArtifactFromPayload(spec.payload, sourceCardId);
    const stableId = `${idPrefix}-art-${spec.key}`;
    sessionArtifacts[stableId] = { ...artifact, id: stableId };

    const nodeId = `${idPrefix}-node-${spec.key}`;
    canvasArtifactNodes[nodeId] = {
      id: nodeId,
      artifactId: stableId,
      versionId: artifact.latestVersionId,
      sourceCardId,
      position,
      size,
    };
    canvasArtifactOrder.push(nodeId);
    return { ...position, ...size };
  };

  /**
   * Lay out columns left-to-right from `originX`, each centred on the y=0 axis,
   * advancing by each column's real widest node (never a fixed stride, so a
   * 680-wide table can't slide under the next column). Returns placed rects.
   */
  const placeColumns = (
    columns: Zone["columns"],
    originX: number,
  ): Rect[] => {
    const rects: Rect[] = [];
    let x = originX;
    for (const column of columns) {
      const sizes = column.items.map(sizeOf);
      const positions = centredColumn(sizes, x, NODE_GAP_Y);
      if (column.label) {
        const topY = positions[0]?.y ?? 0;
        addLabel(
          `col-${column.key}`,
          column.label,
          { x, y: topY + COLUMN_LABEL_OFFSET_Y },
          COLUMN_LABEL_FONT_SIZE,
          480,
        );
      }
      column.items.forEach((spec, j) => rects.push(place(spec, positions[j]!)));
      x += Math.max(...sizes.map((s) => s.w)) + NODE_GAP_X;
    }
    return rects;
  };

  // The whole canvas opens framed on the seed card, the standalone band, and the
  // first zone — so the reader lands on the disclaimer and the pitch, not in space.
  const openingRects: Rect[] = [
    { x: seedPosition.x, y: seedPosition.y, w: 420, h: 220 },
  ];

  for (const placement of standalone) {
    openingRects.push(place(placement.spec, placement.position));
  }

  zones.forEach((zone, i) => {
    const originX = zoneX[zone.key];
    if (originX === undefined) {
      throw new Error(`Zone "${zone.key}" has no x-origin in zoneX`);
    }
    addLabel(`${zone.key}-title`, zone.title, { x: originX, y: ZONE_TITLE_Y }, ZONE_TITLE_FONT_SIZE, 1600);
    addLabel(
      `${zone.key}-sub`,
      zone.subtitle,
      { x: originX, y: ZONE_SUBTITLE_Y },
      ZONE_SUBTITLE_FONT_SIZE,
      1200,
    );
    const rects = placeColumns(zone.columns, originX);
    if (i === 0) openingRects.push(...rects);
  });

  const bounds = boundsOfRects(openingRects);
  const viewport = bounds
    ? viewportForBounds(bounds, openingScale, 120)
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
    canvasTheme,
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasAssets: {},
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasSkills: {},
    canvasSkillNodes: {},
    canvasSkillOrder: [],
    canvasTextLabels,
    canvasTextLabelOrder,
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}
