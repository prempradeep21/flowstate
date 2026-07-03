export const LANDING2_SCENES = [
  { id: "prologue", label: "Prologue" },
  { id: "chat-trap", label: "The trap" },
  { id: "three-pains", label: "The pains" },
  { id: "canvas-break", label: "The break" },
  { id: "artifact-orbit", label: "Artifacts" },
  { id: "inputs", label: "Inputs" },
  { id: "share", label: "Share" },
  { id: "finale", label: "Start" },
] as const;

export type Landing2SceneId = (typeof LANDING2_SCENES)[number]["id"];

export const LANDING2_COPY = {
  prologue: {
    yearStart: 2021,
    yearEnd: 2026,
    line2021: "Let there be intelligence.",
    line2026: "Now we all work with AI.",
    kicker: "The interface didn't catch up.",
    body: "The models got brilliant. The container stayed a chat box — one vertical thread swallowing maps, tables, code, and every breakthrough you never find again.",
  },
  chatTrap: {
    kicker: "Act I — The filing cabinet",
    headline: "Everything you make\ngets buried in scroll.",
    body: "You ask for a map. A table. A plan. They render — then sink beneath messages you'll never scroll back to.",
  },
  threePains: [
    {
      id: "cross-chat",
      kicker: "Pain 01",
      headline: "Three chats.\nZero shared context.",
      body: "Each thread is an island. You copy, paste, and watch the reasoning evaporate.",
    },
    {
      id: "milestones",
      kicker: "Pain 02",
      headline: "Progress you can't\nhand to anyone.",
      body: "Exports, MD files, screenshots — milestones trapped in formats nobody can continue.",
    },
    {
      id: "tabs",
      kicker: "Pain 03",
      headline: "Forty-seven tabs.\nOne tired brain.",
      body: "PDFs, sheets, Notion, Figma, half-built tools — juggled across formats with no single terrain.",
    },
  ],
  canvasBreak: {
    kicker: "Act II — The break",
    tagline: "Flowstate",
    headline: "Your work deserves\na canvas — not a column.",
    body: "Branch parallel threads. Park artifacts beside the question. Navigate your thinking like terrain — the way your brain actually works.",
  },
  artifactOrbit: {
    kicker: "What you create",
    headline: "Outputs that stay\non the canvas.",
    body: "Tables, maps, timelines, todos, custom UI — real artifacts you can move, reuse, and share.",
    hubLabels: [
      "Curate",
      "Ideate",
      "Create",
      "Learn",
      "Build",
      "Reference",
      "Research",
    ] as const,
  },
  inputs: {
    kicker: "What you bring",
    headline: "Paste the link.\nDrop the file.\nAttach the skill.",
    body: "Every reference enters the question in context — same composer as the app.",
  },
  share: {
    kicker: "Share the progress",
    headline: "Someone should pick up\nexactly where you left off.",
    scenarios: [
      {
        title: "Share the second-trimester research with your partner",
        body: "Not a wall of chat — a canvas with artifacts, threads, and context intact.",
      },
      {
        title: "Invite your co-founder onto the market research",
        body: "They see the map, the table, the reasoning — and keep building.",
      },
    ],
  },
  finale: {
    headline: "Stay in your flowstate.",
    body: "One open canvas for the documents, the tabs, the chats, and everything you build with AI.",
    cta: "Start creating",
    secondary: "Classic landing →",
  },
} as const;

export const LANDING2_ARTIFACT_IDS = [
  "table",
  "map",
  "timeline",
  "todo",
  "calendar",
  "custom",
  "chart-bar",
  "embed",
] as const;

/** Accent index per artifact for colored rails */
export const LANDING2_ARTIFACT_ACCENTS = [0, 5, 6, 2, 4, 1, 3, 7] as const;
