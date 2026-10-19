import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  episodePayload,
  linkGroupPayload,
  mechanismPayload,
  quotePayload,
} from "@/lib/transcriptArtifacts";
import { layoutChapters } from "@/lib/transcriptImport/chapterLayout";
import {
  conn,
  convCard,
  spawnPayload,
  spawnWebsite,
  spawnWebsites,
  thread,
  threadGist,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";

/** The transcript never names its speaker, so the role label is the attribution. */
const SPEAKER = "Narrator";

export const TIP_THREAD_MAIN = "tip-thread-main";
export const TIP_THREAD_ADOBE = "tip-thread-adobe";
export const TIP_THREAD_PREFIGMA = "tip-thread-prefigma";
export const TIP_THREAD_DYLAN = "tip-thread-dylan";

/** Design tools history conversation graph for the transcript-import playground. */
/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_MAIN]:
    "The arc of professional design tools: Photoshop as the first mass pro tool, Canva democratizing design for everyone else, the Photoshop era ending, and Figma's web-native bet winning the evolution.",
  [TIP_THREAD_ADOBE]:
    "Respect for the depth of Adobe's interaction design across Photoshop, Premiere Pro and After Effects — colour pickers, keyframes and professional editing paradigms were among the toughest UX problems, and had to be invented from scratch.",
  [TIP_THREAD_PREFIGMA]:
    "The landscape before Figma: Sketch dominated interface design but was Mac-only, with Zeplin and smaller tools filling the gaps around it.",
  [TIP_THREAD_DYLAN]:
    "Why Figma was not luck — CEO Dylan Field was a longtime WebGL enthusiast, and GPU power in the browser is what made the product possible, as a water-simulation demo rendering on the web showed.",
};

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
  const threadGists = Object.fromEntries(
    threadOrder.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  // ---- Chapter heads (the main spine) -------------------------------------
  const mainDefs = [
    {
      id: "tip-c-main-1",
      title: "Photoshop — first mass pro tool",
      summary:
        "Photoshop reached the masses first, but really served a niche of specialized designers. Training institutions sprang up to teach it.",
    },
    {
      id: "tip-c-main-2",
      title: "Canva democratizes design",
      summary:
        "Canva opened design to far more people than Photoshop ever did — a second wave of democratization.",
    },
    {
      id: "tip-c-main-3",
      title: "Photoshop era ends",
      summary:
        "For a long time Photoshop was the main tool — until Figma disrupted the category.",
    },
    {
      id: "tip-c-main-4",
      title: "Figma's web-native bet",
      summary:
        "Figma bet hard on design in the browser — no download required, democratizing design again.",
    },
    {
      id: "tip-c-main-5",
      title: "Figma wins the evolution",
      summary:
        "Design tools evolved through waves of democratization; Figma came out on top.",
    },
  ];

  for (const def of mainDefs) {
    cards[def.id] = convCard(def.id, TIP_THREAD_MAIN, def.title, def.summary);
    cardOrder.push(def.id);
  }

  // ---- Adobe craft (chapter 2) --------------------------------------------
  const adobeDefs = [
    {
      id: "tip-c-adobe-1",
      title: "Adobe suite complexity",
      summary:
        "Photoshop, Premiere Pro, and After Effects — respect for how complicated and deep their interaction design is.",
    },
    {
      id: "tip-c-adobe-2",
      title: "Interaction design mastery",
      summary:
        "Among the toughest UX problems: inventing color pickers, keyframes, and professional editing paradigms.",
    },
    {
      id: "tip-c-adobe-3",
      title: "Color pickers & keyframes",
      summary:
        "These interactions didn't exist before Adobe — they had to be invented from scratch.",
    },
  ];
  for (const def of adobeDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_ADOBE,
      def.title,
      def.summary,
      "tip-c-main-2",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-2", "tip-c-adobe-1", "bottom", "top"));
  connections.push(conn("tip-c-adobe-1", "tip-c-adobe-2", "right", "left"));
  connections.push(conn("tip-c-adobe-2", "tip-c-adobe-3", "right", "left"));

  // ---- Pre-Figma landscape (chapter 3) ------------------------------------
  const preDefs = [
    {
      id: "tip-c-pre-1",
      title: "Sketch — Mac only",
      summary: "Before Figma, Sketch dominated for interface design — Mac users only.",
    },
    {
      id: "tip-c-pre-2",
      title: "Zeplin & smaller tools",
      summary: "Zeplin and other smaller players filled gaps in the pre-Figma landscape.",
    },
  ];
  for (const def of preDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_PREFIGMA,
      def.title,
      def.summary,
      "tip-c-main-3",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-3", "tip-c-pre-1", "bottom", "top"));
  connections.push(conn("tip-c-pre-1", "tip-c-pre-2", "right", "left"));

  // ---- Dylan Field & WebGL (chapter 4) ------------------------------------
  const dylanDefs = [
    {
      id: "tip-c-dylan-1",
      title: "Dylan Field & WebGL",
      summary:
        "Figma wasn't luck — CEO Dylan Field was a longtime WebGL enthusiast; browser GPU power enabled the product.",
    },
    {
      id: "tip-c-dylan-2",
      title: "WebGL water demo",
      summary:
        "A video explaining the capabilities of WebGL with a splashing water 3D moving display, rendering on the web.",
    },
  ];
  for (const def of dylanDefs) {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_DYLAN,
      def.title,
      def.summary,
      "tip-c-main-4",
    );
    cardOrder.push(def.id);
  }
  connections.push(conn("tip-c-main-4", "tip-c-dylan-1", "bottom", "top"));
  connections.push(conn("tip-c-dylan-1", "tip-c-dylan-2", "right", "left"));

  // ---- Artifacts — each lands in the chapter of its source card -----------
  spawnWebsites(
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
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnWebsite(
    "dylan-wiki",
    "https://en.wikipedia.org/wiki/Dylan_Field",
    "Dylan Field",
    "tip-c-dylan-1",
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
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

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
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );


  /*
   * Extracted artifacts, per the transcript-artifacts skill. Every string below is
   * a verbatim lift from DESIGN_TOOLS_HISTORY_TRANSCRIPT.
   *
   * This transcript yields far less than the other two, and that is the correct
   * result: ~330 words of casual monologue with no numbers, no disagreement and no
   * defined terms. Chapter 3 (the pre-Figma landscape) earns no primary artifact at
   * all — two named tools with one attribute between them is not a table.
   */

  spawnPayload(
    "tip-art-quote-masses",
    quotePayload("Masses, but a niche", {
      text:
        "Photoshop is the first ever design tool that reached the masses and although we consider it as masses, it actually is for a niche of specialized designers.",
      speaker: SPEAKER,
      context: "Opening claim about where design tooling started",
    }),
    "tip-c-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-quote-interactions",
    quotePayload("Inventing the interactions", {
      text:
        "I think it was one of the most toughest jobs to create interactions for things like color pickers.",
      speaker: SPEAKER,
      context: "On respect for Adobe's interaction design",
    }),
    "tip-c-adobe-2",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-quote-promise",
    quotePayload("The crazy promise", {
      text: "Figma came in with the crazy promise of doing design on the web.",
      speaker: SPEAKER,
      context: "On what set Figma apart from Sketch",
    }),
    "tip-c-main-4",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-mech-web",
    mechanismPayload("Why web-native was not luck", {
      steps: [
        {
          id: "dylan",
          label: "Dylan Field, a WebGL enthusiast for a very long time",
          note: "CEO of Figma",
        },
        {
          id: "webgl",
          label: "WebGL rendering 3D in the browser",
          note: "A splashing water display, rendering on the web",
        },
        { id: "web", label: "Design on the web" },
        { id: "nodownload", label: "You don't have to download a software anymore" },
        { id: "democratize", label: "Democratized it for so many people" },
      ],
      edges: [
        { from: "dylan", to: "webgl" },
        { from: "webgl", to: "web", label: "made it possible" },
        { from: "web", to: "nodownload" },
        { from: "nodownload", to: "democratize" },
      ],
    }),
    "tip-c-dylan-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  /*
   * The masthead. This source is a voice note, not a published episode — no
   * channel, no URL, no thumbnail, no duration — so the artifact is the chapter
   * index alone. The link directory is the better half here: the transcript
   * names seven tools, which is exactly the "products" shape the kind exists for.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-design-episode", "tip-art-design-links"];

  spawnPayload(
    "tip-art-design-episode",
    episodePayload("The recording", {
      videoTitle: "Design tools history",
      description:
        "A voice note tracing design tooling from Photoshop through Canva and Sketch to Figma.",
      chapters: mainDefs.map((def, index) => ({
        label: def.title,
        groupId: `tip-design-chapter-${index + 1}`,
      })),
    }),
    "tip-c-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );
  spawnPayload(
    "tip-art-design-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "Tools discussed",
          links: [
            { label: "Photoshop", url: "https://www.adobe.com/products/photoshop.html" },
            { label: "Canva", url: "https://www.canva.com" },
            { label: "Premiere Pro", url: "https://www.adobe.com/products/premiere.html" },
            { label: "After Effects", url: "https://www.adobe.com/products/aftereffects.html" },
            { label: "Sketch", url: "https://www.sketch.com" },
            { label: "Zeplin", url: "https://zeplin.io" },
            { label: "Figma", url: "https://www.figma.com" },
          ],
        },
        {
          label: "People",
          links: [
            { label: "Dylan Field", url: "https://en.wikipedia.org/wiki/Dylan_Field" },
          ],
        },
        {
          label: "Watch",
          links: [
            {
              label: "WebGL Water",
              url: "https://www.youtube.com/watch?v=R0O_9bp3EKQ",
            },
          ],
        },
      ],
    }),
    "tip-c-main-1",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
  );

  const layout = layoutChapters({
    mainCardIds: mainDefs.map((def) => def.id),
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    idPrefix: "tip-design",
  });

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder,
    threadGists,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
