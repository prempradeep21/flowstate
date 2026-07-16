import { payloadToArtifactKind } from "@/lib/artifactTypes";
import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  boundsOfRects,
  CLUSTER_GAP_X,
  CLUSTER_TITLE_FONT_SIZE,
  CLUSTER_YEAR_FONT_SIZE,
  columnPositions,
  NODE_GAP_X,
  NODE_GAP_Y,
  rowPositions,
  SECTION_LABEL_FONT_SIZE,
  SUB_LABEL_FONT_SIZE,
  viewportForBounds,
  type Rect,
} from "@/lib/sampleCanvases/layout";
import {
  PKNIGHT_ERAS,
  PKNIGHT_OVERVIEW_ROWS,
  PKNIGHT_OVERVIEW_STICKIES,
  PKNIGHT_SEED_CARD,
  PKNIGHT_SUBTITLE,
  PKNIGHT_TIMELINE,
  type SampleArtifactSpec,
} from "@/lib/sampleCanvases/philKnight/data";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  CanvasTextLabel,
  Card,
  Thread,
} from "@/lib/store";

const ROOT_CARD_ID = "pknight-card-root";
const THREAD_ID = "pknight-thread-main";

/** Overview band geometry (world px). */
const OVERVIEW_LABEL_POS = { x: 0, y: -40 };
const OVERVIEW_SUBTITLE_POS = { x: 0, y: 52 };
const OVERVIEW_ROWS_START_Y = 140;
/** Overview annotation stickies sit to the right of the first chart row. */
const OVERVIEW_STICKY_X = 1800;
/** Era cluster geometry. */
const CLUSTER_ROW_Y = 2100;
const CLUSTER_TITLE_OFFSET_Y = 240;
const CLUSTER_COLUMN_LABEL_OFFSET_Y = 400;
const CLUSTER_ITEMS_OFFSET_Y = 460;
const CLUSTER_COLUMN_STRIDE_X = 520 + NODE_GAP_X;
/** Annotation (sticky-note) column to the right of the two media columns. */
const STICKY_COLUMN_OFFSET_X = 2 * CLUSTER_COLUMN_STRIDE_X;
const STICKY_GAP_Y = 40;
const CLUSTER_STRIDE_X = STICKY_COLUMN_OFFSET_X + 320 + CLUSTER_GAP_X;
/** Alternate clusters drop by this much — a zigzag that reads as a timeline. */
const CLUSTER_STAGGER_Y = 450;

export function buildPhilKnightCanvas(): CanvasSnapshot {
  const threads: Record<string, Thread> = {
    [THREAD_ID]: { id: THREAD_ID, accentColour: THREAD_ACCENT_PALETTE[0]! },
  };
  const cards: Record<string, Card> = {
    [ROOT_CARD_ID]: {
      id: ROOT_CARD_ID,
      threadId: THREAD_ID,
      question: PKNIGHT_SEED_CARD.question,
      answer: PKNIGHT_SEED_CARD.answer,
      status: "done",
      position: { x: -700, y: OVERVIEW_ROWS_START_Y },
      parentCardId: null,
      parentConversationId: null,
    },
  };

  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];
  const overviewRects: Rect[] = [];

  const addLabel = (
    key: string,
    text: string,
    position: { x: number; y: number },
    fontSize: number,
    width?: number,
  ) => {
    const id = `pknight-label-${key}`;
    canvasTextLabels[id] = { id, text, position, fontSize, width };
    canvasTextLabelOrder.push(id);
  };

  const placeArtifact = (
    spec: SampleArtifactSpec,
    position: { x: number; y: number },
  ): { w: number; h: number } => {
    const artifact = createSessionArtifactFromPayload(
      spec.payload,
      ROOT_CARD_ID,
    );
    const stableId = `pknight-art-${spec.key}`;
    sessionArtifacts[stableId] = { ...artifact, id: stableId };

    const kind = payloadToArtifactKind(spec.payload);
    const size = getDefaultArtifactSize(kind, spec.payload);
    const nodeId = `pknight-node-${spec.key}`;
    canvasArtifactNodes[nodeId] = {
      id: nodeId,
      artifactId: stableId,
      versionId: artifact.latestVersionId,
      sourceCardId: ROOT_CARD_ID,
      position,
      size,
    };
    canvasArtifactOrder.push(nodeId);
    return size;
  };

  const specSize = (spec: SampleArtifactSpec) =>
    getDefaultArtifactSize(payloadToArtifactKind(spec.payload), spec.payload);

  // --- Overview band: section label, metric rows, annotations, timeline ---
  addLabel("overview", "OVERVIEW", OVERVIEW_LABEL_POS, SECTION_LABEL_FONT_SIZE);
  addLabel(
    "subtitle",
    PKNIGHT_SUBTITLE,
    OVERVIEW_SUBTITLE_POS,
    SUB_LABEL_FONT_SIZE,
    980,
  );

  {
    const sizes = PKNIGHT_OVERVIEW_STICKIES.map(specSize);
    const positions = columnPositions(
      sizes,
      { x: OVERVIEW_STICKY_X, y: OVERVIEW_ROWS_START_Y },
      STICKY_GAP_Y,
    );
    PKNIGHT_OVERVIEW_STICKIES.forEach((spec, i) => {
      const size = placeArtifact(spec, positions[i]!);
      overviewRects.push({ ...positions[i]!, ...size });
    });
  }

  let rowY = OVERVIEW_ROWS_START_Y;
  for (const row of PKNIGHT_OVERVIEW_ROWS) {
    const sizes = row.map(specSize);
    const positions = rowPositions(sizes, { x: 0, y: rowY }, NODE_GAP_X);
    row.forEach((spec, i) => {
      const size = placeArtifact(spec, positions[i]!);
      overviewRects.push({ ...positions[i]!, ...size });
    });
    const rowHeight = Math.max(...sizes.map((s) => s.h));
    rowY += rowHeight + NODE_GAP_Y;
  }

  const timelineSize = placeArtifact(PKNIGHT_TIMELINE, { x: 0, y: rowY });
  overviewRects.push({ x: 0, y: rowY, ...timelineSize });

  // --- Era clusters, chronological left-to-right on a staggered zigzag ---
  PKNIGHT_ERAS.forEach((era, eraIndex) => {
    const clusterX = eraIndex * CLUSTER_STRIDE_X;
    const clusterY = CLUSTER_ROW_Y + (eraIndex % 2) * CLUSTER_STAGGER_Y;
    addLabel(
      `${era.key}-year`,
      era.year,
      { x: clusterX, y: clusterY },
      CLUSTER_YEAR_FONT_SIZE,
    );
    addLabel(
      `${era.key}-title`,
      era.title,
      { x: clusterX, y: clusterY + CLUSTER_TITLE_OFFSET_Y },
      CLUSTER_TITLE_FONT_SIZE,
      2 * CLUSTER_COLUMN_STRIDE_X,
    );

    era.columns.forEach((column, columnIndex) => {
      const columnX = clusterX + columnIndex * CLUSTER_COLUMN_STRIDE_X;
      if (column.label) {
        addLabel(
          `${era.key}-col${columnIndex}`,
          column.label,
          { x: columnX, y: clusterY + CLUSTER_COLUMN_LABEL_OFFSET_Y },
          SUB_LABEL_FONT_SIZE,
          480,
        );
      }
      const sizes = column.items.map(specSize);
      const positions = columnPositions(
        sizes,
        { x: columnX, y: clusterY + CLUSTER_ITEMS_OFFSET_Y },
        NODE_GAP_Y,
      );
      column.items.forEach((spec, i) => placeArtifact(spec, positions[i]!));
    });

    const stickySizes = era.stickies.map(specSize);
    const stickyPositions = columnPositions(
      stickySizes,
      {
        x: clusterX + STICKY_COLUMN_OFFSET_X,
        y: clusterY + CLUSTER_ITEMS_OFFSET_Y,
      },
      STICKY_GAP_Y,
    );
    era.stickies.forEach((spec, i) =>
      placeArtifact(spec, stickyPositions[i]!),
    );
  });

  // Open framed on the overview band (screen = world * scale + viewport).
  const bounds = boundsOfRects(overviewRects);
  const viewport = bounds
    ? viewportForBounds(bounds, 0.5, 80)
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
