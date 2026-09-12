import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { CARD_WIDTH, getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { buildCanvasSnapshot, type CanvasSnapshot } from "@/lib/canvasSnapshot";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  ABNB_CHAPTERS,
  ABNB_DISTRICTS,
  ABNB_SCOREBOARD_ROWS,
  ABNB_SCOREBOARD_STICKIES,
  ABNB_SEED_CARD,
  ABNB_SUBTITLE,
  ABNB_TIMELINE,
} from "@/lib/sampleCanvases/airbnb/data";
import {
  CHAPTER_COLUMN_LABEL_OFFSET_Y,
  CHAPTER_GAP_X,
  CHAPTER_ITEMS_OFFSET_Y,
  CHAPTER_STAGGER_Y,
  CHAPTER_TITLE_OFFSET_Y,
  CHAPTERS_GAP_Y,
  CLUSTER_COLUMN_LABEL_OFFSET_Y,
  CLUSTER_ITEMS_OFFSET_Y,
  clusterColumnOrigins,
  DISTRICT_CLUSTER_GAP_X,
  DISTRICT_CONTENT_OFFSET_Y,
  DISTRICT_LABEL_FONT_SIZE,
  DISTRICT_SUBTITLE_FONT_SIZE,
  DISTRICT_SUBTITLE_OFFSET_Y,
  DISTRICT_SUBTITLE_WIDTH,
  districtBands,
  DISTRICTS_START_GAP_Y,
  SCOREBOARD_LABEL_POS,
  SCOREBOARD_ROWS_START_Y,
  SCOREBOARD_SUBTITLE_POS,
  SCOREBOARD_SUBTITLE_WIDTH,
  specSize,
  stackHeight,
  STICKY_GAP_Y,
} from "@/lib/sampleCanvases/companyLayout";
import {
  boundsOfRects,
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
import type { SampleArtifactSpec, SampleCluster } from "@/lib/sampleCanvases/specTypes";
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

const ROOT_CARD_ID = "abnb-card-root";
const THREAD_ID = "abnb-thread-main";
const SEED_CARD_POS = { x: -700, y: SCOREBOARD_ROWS_START_Y };
/**
 * Only `minX`/`minY` of the seed card matter (viewportForBounds ignores the far
 * edges), but the rect needs a height to exist — cards size themselves at render.
 */
const SEED_CARD_NOMINAL_H = 320;

export function buildAirbnbCanvas(): CanvasSnapshot {
  const threads: Record<string, Thread> = {
    [THREAD_ID]: { id: THREAD_ID, accentColour: THREAD_ACCENT_PALETTE[0]! },
  };
  const cards: Record<string, Card> = {
    [ROOT_CARD_ID]: {
      id: ROOT_CARD_ID,
      threadId: THREAD_ID,
      question: ABNB_SEED_CARD.question,
      answer: ABNB_SEED_CARD.answer,
      status: "done",
      position: SEED_CARD_POS,
      parentCardId: null,
      parentConversationId: null,
    },
  };

  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];
  const scoreboardRects: Rect[] = [];

  const addLabel = (
    key: string,
    text: string,
    position: { x: number; y: number },
    fontSize: number,
    width?: number,
  ) => {
    const id = `abnb-label-${key}`;
    canvasTextLabels[id] = { id, text, position, fontSize, width };
    canvasTextLabelOrder.push(id);
  };

  const placeArtifact = (
    spec: SampleArtifactSpec,
    position: { x: number; y: number },
  ): { w: number; h: number } => {
    const artifact = createSessionArtifactFromPayload(spec.payload, ROOT_CARD_ID);
    const stableId = `abnb-art-${spec.key}`;
    sessionArtifacts[stableId] = { ...artifact, id: stableId };

    const kind = payloadToArtifactKind(spec.payload);
    const size = getDefaultArtifactSize(kind, spec.payload);
    const nodeId = `abnb-node-${spec.key}`;
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

  /**
   * Lay out one cluster: title, per-column sub-labels, items, and the sticky
   * annotation column. Every x comes from `clusterColumnOrigins`, which measures
   * the real artifact widths — a 680 table pushes the stickies right instead of
   * sliding under them. Returns the cluster's full width so the caller derives
   * the next origin rather than assuming a stride.
   */
  const placeCluster = (
    cluster: SampleCluster,
    origin: { x: number; y: number },
    opts: { titleOffsetY: number; columnLabelOffsetY: number; itemsOffsetY: number },
  ): number => {
    const { columnOrigins, stickyX, width } = clusterColumnOrigins(cluster, origin.x);

    addLabel(
      `${cluster.key}-title`,
      cluster.title,
      { x: origin.x, y: origin.y + opts.titleOffsetY },
      CLUSTER_TITLE_FONT_SIZE,
      Math.max(width - 320, 480),
    );

    cluster.columns.forEach((column, columnIndex) => {
      const columnX = columnOrigins[columnIndex]!;
      if (column.label) {
        addLabel(
          `${cluster.key}-col${columnIndex}`,
          column.label,
          { x: columnX, y: origin.y + opts.columnLabelOffsetY },
          SUB_LABEL_FONT_SIZE,
          480,
        );
      }
      const sizes = column.items.map(specSize);
      const positions = columnPositions(
        sizes,
        { x: columnX, y: origin.y + opts.itemsOffsetY },
        NODE_GAP_Y,
      );
      column.items.forEach((spec, i) => placeArtifact(spec, positions[i]!));
    });

    const stickySizes = cluster.stickies.map(specSize);
    const stickyPositions = columnPositions(
      stickySizes,
      { x: stickyX, y: origin.y + opts.itemsOffsetY },
      STICKY_GAP_Y,
    );
    cluster.stickies.forEach((spec, i) => placeArtifact(spec, stickyPositions[i]!));

    return width;
  };

  // --- Scoreboard band -------------------------------------------------
  addLabel("scoreboard", "THE SCOREBOARD", SCOREBOARD_LABEL_POS, SECTION_LABEL_FONT_SIZE);
  addLabel(
    "subtitle",
    ABNB_SUBTITLE,
    SCOREBOARD_SUBTITLE_POS,
    SUB_LABEL_FONT_SIZE,
    SCOREBOARD_SUBTITLE_WIDTH,
  );

  let rowY = SCOREBOARD_ROWS_START_Y;
  let rowsRightEdge = 0;
  for (const row of ABNB_SCOREBOARD_ROWS) {
    const sizes = row.map(specSize);
    const positions = rowPositions(sizes, { x: 0, y: rowY }, NODE_GAP_X);
    row.forEach((spec, i) => {
      const size = placeArtifact(spec, positions[i]!);
      scoreboardRects.push({ ...positions[i]!, ...size });
      rowsRightEdge = Math.max(rowsRightEdge, positions[i]!.x + size.w);
    });
    rowY += Math.max(...sizes.map((s) => s.h)) + NODE_GAP_Y;
  }

  // Derived, not the research canvas's magic 1800: the stickies sit just right
  // of the widest metric row. The timeline is excluded — it is 1920 wide and
  // would shove the annotations away from the charts they annotate.
  const scoreboardStickyX = rowsRightEdge + NODE_GAP_X;
  {
    const sizes = ABNB_SCOREBOARD_STICKIES.map(specSize);
    const positions = columnPositions(
      sizes,
      { x: scoreboardStickyX, y: SCOREBOARD_ROWS_START_Y },
      STICKY_GAP_Y,
    );
    ABNB_SCOREBOARD_STICKIES.forEach((spec, i) => {
      const size = placeArtifact(spec, positions[i]!);
      scoreboardRects.push({ ...positions[i]!, ...size });
    });
  }

  // Timeline last and below the sticky stack, so its 1920px can never run under
  // the annotation column.
  const stickyBottom =
    SCOREBOARD_ROWS_START_Y +
    stackHeight(ABNB_SCOREBOARD_STICKIES.map(specSize), STICKY_GAP_Y);
  const timelineY = Math.max(rowY, stickyBottom + NODE_GAP_Y);
  const timelineSize = placeArtifact(ABNB_TIMELINE, { x: 0, y: timelineY });
  scoreboardRects.push({ x: 0, y: timelineY, ...timelineSize });

  const scoreboardBottom = timelineY + timelineSize.h;

  // --- Lens districts, stacked ----------------------------------------
  const districtsStartY = scoreboardBottom + DISTRICTS_START_GAP_Y;
  const bands = districtBands(ABNB_DISTRICTS, districtsStartY);

  ABNB_DISTRICTS.forEach((district, districtIndex) => {
    const bandY = bands[districtIndex]!.top;
    addLabel(
      `${district.key}-label`,
      district.label,
      { x: 0, y: bandY },
      DISTRICT_LABEL_FONT_SIZE,
    );
    addLabel(
      `${district.key}-subtitle`,
      district.subtitle,
      { x: 0, y: bandY + DISTRICT_SUBTITLE_OFFSET_Y },
      DISTRICT_SUBTITLE_FONT_SIZE,
      DISTRICT_SUBTITLE_WIDTH,
    );

    let clusterX = 0;
    for (const cluster of district.clusters) {
      const width = placeCluster(
        cluster,
        { x: clusterX, y: bandY + DISTRICT_CONTENT_OFFSET_Y },
        {
          titleOffsetY: 0,
          columnLabelOffsetY: CLUSTER_COLUMN_LABEL_OFFSET_Y,
          itemsOffsetY: CLUSTER_ITEMS_OFFSET_Y,
        },
      );
      clusterX += width + DISTRICT_CLUSTER_GAP_X;
    }
  });

  // --- Chapter row: chronological, zigzagged ---------------------------
  const lastBand = bands[bands.length - 1];
  const chaptersY =
    (lastBand ? lastBand.top + lastBand.height : districtsStartY) + CHAPTERS_GAP_Y;

  let chapterX = 0;
  ABNB_CHAPTERS.forEach((chapter, chapterIndex) => {
    const chapterY = chaptersY + (chapterIndex % 2) * CHAPTER_STAGGER_Y;
    addLabel(
      `${chapter.key}-year`,
      chapter.year,
      { x: chapterX, y: chapterY },
      CLUSTER_YEAR_FONT_SIZE,
    );
    const width = placeCluster(
      chapter,
      { x: chapterX, y: chapterY },
      {
        titleOffsetY: CHAPTER_TITLE_OFFSET_Y,
        columnLabelOffsetY: CHAPTER_COLUMN_LABEL_OFFSET_Y,
        itemsOffsetY: CHAPTER_ITEMS_OFFSET_Y,
      },
    );
    chapterX += width + CHAPTER_GAP_X;
  });

  // Open framed on the scoreboard — including the seed card, so the question
  // this canvas answers is on screen rather than 270px off the left edge.
  const bounds = boundsOfRects([
    ...scoreboardRects,
    { ...SEED_CARD_POS, w: CARD_WIDTH, h: SEED_CARD_NOMINAL_H },
  ]);
  const viewport = bounds ? viewportForBounds(bounds, 0.5, 80) : { x: 0, y: 0, scale: 1 };

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
