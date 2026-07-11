import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  BranchGroup,
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
import {
  ARTIFACT_OFFSET_X,
  ARTIFACT_STACK_Y,
  CARD_STEP_X,
  conn,
  convCard,
  INPUT_ARTIFACT_STEP,
  ORIGIN_X,
  OUTPUT_ARTIFACT_LANE_X,
  spawnInputWebsiteStrip,
  spawnPayload,
  spawnWebsite,
  thread,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";

export const TIP_GROUP_ID = "tip-import-group";
export const TIP_THREAD_MAIN = "tip-thread-main";
export const TIP_THREAD_ADOBE = "tip-thread-adobe";
export const TIP_THREAD_PREFIGMA = "tip-thread-prefigma";
export const TIP_THREAD_DYLAN = "tip-thread-dylan";

const MAIN_Y = 720;
const ADOBE_Y = 80;
const PREFIGMA_Y = 1320;
const DYLAN_Y = 1820;
const INPUT_ARTIFACTS_Y_LOCAL = 2360;

/** Design tools history conversation graph for the transcript-import playground. */
export function buildDesignToolsCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const threads: Record<string, Thread> = {
    [TIP_THREAD_MAIN]: thread(TIP_THREAD_MAIN, 0),
    [TIP_THREAD_ADOBE]: thread(TIP_THREAD_ADOBE, 1),
    [TIP_THREAD_PREFIGMA]: thread(TIP_THREAD_PREFIGMA, 2),
    [TIP_THREAD_DYLAN]: thread(TIP_THREAD_DYLAN, 3),
  };
  const threadOrder = [
    TIP_THREAD_MAIN,
    TIP_THREAD_ADOBE,
    TIP_THREAD_PREFIGMA,
    TIP_THREAD_DYLAN,
  ];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const mainDefs = [
    {
      id: "tip-c-main-1",
      title: "Photoshop — first mass pro tool",
      summary:
        "Photoshop reached the masses first, but really served a niche of specialized designers. Training institutions sprang up to teach it.",
      x: ORIGIN_X,
    },
    {
      id: "tip-c-main-2",
      title: "Canva democratizes design",
      summary:
        "Canva opened design to far more people than Photoshop ever did — a second wave of democratization.",
      x: ORIGIN_X + CARD_STEP_X,
    },
    {
      id: "tip-c-main-3",
      title: "Photoshop era ends",
      summary:
        "For a long time Photoshop was the main tool — until Figma disrupted the category.",
      x: ORIGIN_X + CARD_STEP_X * 2,
    },
    {
      id: "tip-c-main-4",
      title: "Figma's web-native bet",
      summary:
        "Figma bet hard on design in the browser — no download required, democratizing design again.",
      x: ORIGIN_X + CARD_STEP_X * 3,
    },
    {
      id: "tip-c-main-5",
      title: "Figma wins the evolution",
      summary:
        "Design tools evolved through waves of democratization; Figma came out on top.",
      x: ORIGIN_X + CARD_STEP_X * 4,
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_MAIN,
      def.title,
      def.summary,
      { x: def.x, y: MAIN_Y },
    );
    cardOrder.push(def.id);
  }

  for (let i = 0; i < mainDefs.length - 1; i++) {
    connections.push(
      conn(mainDefs[i]!.id, mainDefs[i + 1]!.id, "right", "left"),
    );
  }

  const main2X = ORIGIN_X + CARD_STEP_X;
  const main3X = ORIGIN_X + CARD_STEP_X * 2;
  const main4X = ORIGIN_X + CARD_STEP_X * 3;
  const main5X = ORIGIN_X + CARD_STEP_X * 4;

  const adobeDefs = [
    {
      id: "tip-c-adobe-1",
      title: "Adobe suite complexity",
      summary:
        "Photoshop, Premiere Pro, and After Effects — respect for how complicated and deep their interaction design is.",
      x: main2X,
    },
    {
      id: "tip-c-adobe-2",
      title: "Interaction design mastery",
      summary:
        "Among the toughest UX problems: inventing color pickers, keyframes, and professional editing paradigms.",
      x: main3X,
    },
    {
      id: "tip-c-adobe-3",
      title: "Color pickers & keyframes",
      summary:
        "These interactions didn't exist before Adobe — they had to be invented from scratch.",
      x: main4X,
    },
  ];

  for (const def of adobeDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_ADOBE,
      def.title,
      def.summary,
      { x: def.x, y: ADOBE_Y },
      "tip-c-main-2",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-2", "tip-c-adobe-1", "top", "bottom"));
  connections.push(conn("tip-c-adobe-1", "tip-c-adobe-2", "right", "left"));
  connections.push(conn("tip-c-adobe-2", "tip-c-adobe-3", "right", "left"));
  connections.push(conn("tip-c-adobe-2", "tip-c-main-3", "bottom", "top"));

  const preDefs = [
    {
      id: "tip-c-pre-1",
      title: "Sketch — Mac only",
      summary: "Before Figma, Sketch dominated for interface design — Mac users only.",
      x: main3X,
    },
    {
      id: "tip-c-pre-2",
      title: "Zeplin & smaller tools",
      summary: "Zeplin and other smaller players filled gaps in the pre-Figma landscape.",
      x: main4X,
    },
  ];

  for (const def of preDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_PREFIGMA,
      def.title,
      def.summary,
      { x: def.x, y: PREFIGMA_Y },
      "tip-c-main-3",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-3", "tip-c-pre-1", "bottom", "top"));
  connections.push(conn("tip-c-pre-1", "tip-c-pre-2", "right", "left"));
  connections.push(conn("tip-c-pre-2", "tip-c-main-4", "top", "bottom"));

  const dylanDefs = [
    {
      id: "tip-c-dylan-1",
      title: "Dylan Field & WebGL",
      summary:
        "Figma wasn't luck — CEO Dylan Field was a longtime WebGL enthusiast; browser GPU power enabled the product.",
      x: main4X,
    },
    {
      id: "tip-c-dylan-2",
      title: "WebGL water demo",
      summary:
        "Evan Wallace's WebGL water simulation showed what the browser could render — a founding inspiration for Figma.",
      x: main5X,
    },
  ];

  for (const def of dylanDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_DYLAN,
      def.title,
      def.summary,
      { x: def.x, y: DYLAN_Y },
      "tip-c-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-4", "tip-c-dylan-1", "bottom", "top"));
  connections.push(conn("tip-c-dylan-1", "tip-c-dylan-2", "right", "left"));
  connections.push(conn("tip-c-dylan-2", "tip-c-main-5", "top", "bottom"));

  const dylanArtifactX = main5X + CARD_WIDTH + ARTIFACT_OFFSET_X;
  const inputStripStartX = ORIGIN_X + CARD_STEP_X * 2;

  spawnInputWebsiteStrip(
    [
      {
        id: "photoshop",
        url: "https://www.adobe.com/products/photoshop.html",
        title: "Adobe Photoshop",
        cardId: "tip-c-main-1",
      },
      {
        id: "canva",
        url: "https://www.canva.com",
        title: "Canva",
        cardId: "tip-c-main-2",
      },
      {
        id: "premiere",
        url: "https://www.adobe.com/products/premiere.html",
        title: "Adobe Premiere Pro",
        cardId: "tip-c-adobe-1",
      },
      {
        id: "aftereffects",
        url: "https://www.adobe.com/products/aftereffects.html",
        title: "Adobe After Effects",
        cardId: "tip-c-adobe-1",
      },
      {
        id: "sketch",
        url: "https://www.sketch.com",
        title: "Sketch",
        cardId: "tip-c-pre-1",
      },
      {
        id: "zeplin",
        url: "https://zeplin.io",
        title: "Zeplin",
        cardId: "tip-c-pre-2",
      },
      {
        id: "figma",
        url: "https://www.figma.com",
        title: "Figma",
        cardId: "tip-c-main-4",
      },
    ],
    inputStripStartX,
    INPUT_ARTIFACTS_Y_LOCAL,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-youtube",
    {
      type: "images",
      title: "WebGL Water Simulation",
      data: {
        items: [
          {
            kind: "youtube",
            url: "https://www.youtube.com/watch?v=R0O_9bp3EKQ",
            title: "WebGL Water Simulation",
            thumb: "https://img.youtube.com/vi/R0O_9bp3EKQ/hqdefault.jpg",
          },
        ],
      },
    },
    "tip-c-dylan-2",
    { x: dylanArtifactX, y: DYLAN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "evan-water",
    "https://madebyevan.com/webgl-water/",
    "WebGL Water (interactive)",
    "tip-c-dylan-2",
    { x: dylanArtifactX + INPUT_ARTIFACT_STEP, y: DYLAN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "dylan-wiki",
    "https://en.wikipedia.org/wiki/Dylan_Field",
    "Dylan Field",
    "tip-c-dylan-1",
    { x: dylanArtifactX + INPUT_ARTIFACT_STEP * 2, y: DYLAN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "figma-origin",
    "https://www.figma.com/blog/design-meet-the-internet/",
    "Design Meet the Internet",
    "tip-c-dylan-1",
    { x: dylanArtifactX + INPUT_ARTIFACT_STEP * 3, y: DYLAN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  spawnPayload(
    "tip-art-sticky",
    {
      type: "stickynote",
      title: "Invented interactions",
      data: {
        text: "Color pickers & keyframes — interactions Adobe invented for pro creative tools.",
        colorId: "chalk",
      },
    },
    "tip-c-adobe-3",
    {
      x: adobeDefs[2]!.x + CARD_WIDTH + ARTIFACT_OFFSET_X,
      y: ADOBE_Y,
    },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const outputX = mainDefs[4]!.x + CARD_WIDTH + OUTPUT_ARTIFACT_LANE_X;
  spawnPayload(
    "tip-art-timeline",
    {
      type: "timeline",
      title: "Design tools evolution",
      data: {
        scale: "year",
        events: [
          { id: "t1", label: "Photoshop era", at: "1990-01-01T12:00:00.000Z" },
          { id: "t2", label: "Canva democratizes", at: "2013-01-01T12:00:00.000Z" },
          { id: "t3", label: "Sketch (Mac)", at: "2016-01-01T12:00:00.000Z" },
          { id: "t4", label: "Figma on web", at: "2016-06-01T12:00:00.000Z", highlight: true },
        ],
      },
    },
    "tip-c-main-5",
    { x: outputX, y: MAIN_Y },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-table",
    {
      type: "table",
      title: "Democratization spectrum",
      data: {
        columns: [
          { key: "tool", label: "Tool" },
          { key: "audience", label: "Audience" },
          { key: "barrier", label: "Barrier" },
        ],
        rows: [
          { tool: "Photoshop", audience: "Pro designers", barrier: "High skill + desktop" },
          { tool: "Canva", audience: "Everyone", barrier: "Low — templates" },
          { tool: "Figma", audience: "Teams on web", barrier: "Low — no install" },
        ],
      },
    },
    "tip-c-main-5",
    { x: outputX, y: MAIN_Y + ARTIFACT_STACK_Y * 2 },
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const groups: Record<string, BranchGroup> = {
    [TIP_GROUP_ID]: {
      id: TIP_GROUP_ID,
      label: "Design tools history import",
      familyRootThreadIds: [TIP_THREAD_MAIN],
      summaryMarkdown: null,
    },
  };

  return {
    cards,
    cardOrder,
    connections,
    threads,
    threadOrder,
    groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: { x: ORIGIN_X + CARD_STEP_X * 2.5, y: MAIN_Y },
  };
}
