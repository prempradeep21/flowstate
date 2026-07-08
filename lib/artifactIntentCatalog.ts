/**
 * Display catalog for artifact spin-up rules (admin Artifact Intent portal).
 *
 * Phase 2: persist portal edits (Supabase or config) and optionally merge
 * into runtime intent detection in artifactIntent.ts. v1 is read-only display
 * curated to match current code — not wired to chat/spawn at runtime.
 */

import type { ArtifactKind } from "@/lib/artifactTypes";
import { artifactKindPriority, getPermissionCopy } from "@/lib/artifactSpawnPriority";

export type ArtifactCatalogKind = ArtifactKind | "text" | "video";

export type ArtifactCreationPath =
  | "ai-intent"
  | "llm-prompt"
  | "url-paste"
  | "manual"
  | "file-drop"
  | "search-images";

export interface ArtifactIntentRule {
  id: string;
  label: string;
  triggers: string[];
  patterns?: string[];
  mandatoryNote?: string;
}

export type SpawnTiming =
  | "ai-auto"            // AI intent match auto-spawns as the first materialized spawn (priority-gated)
  | "permission-preview" // typically shows a permission node instead of auto-spawning
  | "instant"            // spawns immediately with no chat turn (URL paste, file drop, manual placement)
  | "llm-emit"           // only via LLM emit_artifact inside a chat turn; no standalone intent auto-spawn
  | "none";              // no artifact is materialized (prose text)

export interface SpawnTimingMeta {
  id: SpawnTiming;
  label: string;      // short chip label, e.g. "Auto-spawn"
  headline: string;   // one line: the promise, e.g. "Lands on the canvas on the first turn"
  description: string; // 1-2 sentences explaining the timing bucket
  /** Tailwind classes for a small badge: bg + text + border. Match existing palette (see below). */
  badgeClass: string;
  /** Tailwind text color class for accents/dots. */
  accentText: string;
}

export const SPAWN_TIMING_META: Record<SpawnTiming, SpawnTimingMeta> = {
  "ai-auto": {
    id: "ai-auto",
    label: "Auto-spawn",
    headline: "Lands on the canvas automatically when intent matches",
    description:
      "The AI detects a matching intent and this becomes the first materialized spawn, appearing without a permission prompt. Only the highest-priority (or explicitly requested) payload auto-spawns.",
    badgeClass: "bg-violet-500/10 text-violet-800 border-violet-200",
    accentText: "text-violet-700",
  },
  "permission-preview": {
    id: "permission-preview",
    label: "Permission node",
    headline: "Usually appears as a permission node you confirm",
    description:
      "Typically emitted alongside another spawn in the same turn, so it shows a permission preview node on the canvas that you confirm rather than auto-spawning.",
    badgeClass: "bg-amber-500/10 text-amber-900 border-amber-200",
    accentText: "text-amber-700",
  },
  instant: {
    id: "instant",
    label: "Instant",
    headline: "Appears immediately — no chat turn needed",
    description:
      "Materializes right away from a direct action such as pasting a URL, dropping a file, or picking it from the placement menu. No AI turn is involved.",
    badgeClass: "bg-emerald-500/10 text-emerald-900 border-emerald-200",
    accentText: "text-emerald-700",
  },
  "llm-emit": {
    id: "llm-emit",
    label: "LLM emit",
    headline: "Only when the model emits it mid-answer",
    description:
      "Never spawns from a standalone intent match. It only appears when the model calls emit_artifact inside a chat turn.",
    badgeClass: "bg-sky-500/10 text-sky-900 border-sky-200",
    accentText: "text-sky-700",
  },
  none: {
    id: "none",
    label: "No artifact",
    headline: "No artifact — the reply stays as a text card",
    description:
      "Nothing is materialized on the canvas. The model's markdown reply becomes a text card instead.",
    badgeClass: "bg-canvas-bg text-canvas-muted border-canvas-border",
    accentText: "text-canvas-muted",
  },
};

/** Order the buckets should be presented in the UI (most eager -> least). */
export const SPAWN_TIMING_ORDER: SpawnTiming[] = [
  "ai-auto",
  "permission-preview",
  "instant",
  "llm-emit",
  "none",
];

export interface ArtifactIntentEntry {
  kind: ArtifactCatalogKind;
  label: string;
  summary: string;
  creationPaths: ArtifactCreationPath[];
  spawnPriority?: number;
  autoSpawnBehavior: string;
  spawnTiming: SpawnTiming;
  spawnTrigger: string; // short phrase: what fires this spawn, e.g. "Paste a GitHub repo URL"
  permissionCopy?: string;
  rules: ArtifactIntentRule[];
  promptGuidance?: string;
  validation?: string[];
  examples?: string[];
  sourceFiles: string[];
}

export const CREATION_PATH_LABELS: Record<ArtifactCreationPath, string> = {
  "ai-intent": "AI intent",
  "llm-prompt": "LLM prompt",
  "url-paste": "URL paste",
  manual: "Manual",
  "file-drop": "File drop",
  "search-images": "Image search",
};

export const ARTIFACT_INTENT_RESOLUTION_ORDER: {
  step: number;
  label: string;
  detail: string;
}[] = [
  {
    step: 1,
    label: "Explicit artifact name",
    detail:
      'User names the type directly, e.g. "custom UI artifact", "todo list component".',
  },
  {
    step: 2,
    label: "Custom interactive UI",
    detail:
      "Interactive, widget, dashboard, timer, theme/color edits, or inline React source.",
  },
  {
    step: 3,
    label: "To-do / checklist",
    detail: "Task lists, checklists, packing lists, action items.",
  },
  {
    step: 4,
    label: "Table",
    detail:
      'Explicit table requests beat travel/geography keywords — "in a table", "top N" lists.',
  },
  {
    step: 5,
    label: "Timeline",
    detail: "Chronology, roadmap, milestones — not numeric series (those are charts).",
  },
  {
    step: 6,
    label: "Chart",
    detail: "Trends, comparisons, distributions, personal metrics over time.",
  },
  {
    step: 7,
    label: "Map",
    detail: "Travel, trips, geography, cities, countries, where is X.",
  },
  {
    step: 8,
    label: "Calendar",
    detail: "Dates, scheduling, month-grid views.",
  },
  {
    step: 9,
    label: "Street View",
    detail: "Specific venues: station, airport, museum, hotel, landmark.",
  },
];

export const ARTIFACT_SPAWN_GLOBAL_RULES: string[] = [
  "Only the first materialized spawn for a card auto-appears without a permission prompt.",
  "If the user explicitly requested a kind, that payload auto-spawns when it is the first spawn.",
  "Otherwise the highest-priority payload (lowest number) auto-spawns first.",
  "Additional payloads in the same turn show a permission preview node on the canvas.",
  "Same-kind payloads targeting an artifact being edited append a new version in place.",
  "Duplicate same-kind payloads are skipped when an output artifact already exists (unless editing).",
  "Attached asset/skill context blocks are stripped before intent matching to avoid false triggers.",
];

export const SPAWN_PRIORITY_TABLE: { kind: string; priority: number }[] = [
  { kind: "todo", priority: 10 },
  { kind: "calendar", priority: 15 },
  { kind: "timeline", priority: 18 },
  { kind: "table", priority: 20 },
  { kind: "map", priority: 30 },
  { kind: "streetview", priority: 40 },
  { kind: "custom", priority: 50 },
  { kind: "code", priority: 60 },
  { kind: "images", priority: 70 },
  { kind: "3d", priority: 80 },
  { kind: "(default)", priority: 90 },
];

function entry(
  partial: Omit<ArtifactIntentEntry, "spawnPriority"> & {
    spawnPriority?: number;
  },
): ArtifactIntentEntry {
  const kind = partial.kind;
  const priority =
    partial.spawnPriority ??
    (kind !== "text" && kind !== "video"
      ? artifactKindPriority(kind as ArtifactKind)
      : undefined);
  return { ...partial, spawnPriority: priority };
}

export const ARTIFACT_INTENT_CATALOG: ArtifactIntentEntry[] = [
  entry({
    kind: "text",
    label: "Text card",
    summary: "Default prose reply — no artifact is materialized on the canvas.",
    creationPaths: ["llm-prompt"],
    autoSpawnBehavior: "No artifact spawn; markdown text becomes the card response.",
    spawnTiming: "none",
    spawnTrigger: "Default — no structured intent",
    rules: [
      {
        id: "text-default",
        label: "Default response",
        triggers: [
          "General questions without structured deliverable intent",
          "Explanations, advice, and narrative answers",
        ],
      },
    ],
    promptGuidance:
      "Default: write your explanation as normal markdown in your text reply. That becomes a text card.",
    examples: ["What is photosynthesis?", "Explain the tradeoffs of serverless"],
    sourceFiles: ["lib/artifactPrompt.ts"],
  }),
  entry({
    kind: "todo",
    label: "To-do list",
    summary: "Checklists and task lists with checkable items.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior:
      "Auto-spawns on first turn when intent matches or user requested todo; highest spawn priority (10).",
    spawnTiming: "ai-auto",
    spawnTrigger: "Checklist / task-list intent detected",
    permissionCopy: getPermissionCopy("todo"),
    rules: [
      {
        id: "todo-keywords",
        label: "Checklist keywords",
        triggers: [
          "todo list, checklist, task list, action items",
          "things to do/bring/pack/prepare, packing list, prep list",
        ],
        patterns: [
          String.raw`\b(to[- ]?do\s*list|todo\s*list|checklist|task\s*list|...)\b`,
        ],
        mandatoryNote:
          "MUST call emit_artifact type todo. Put every task in data.items. Do not list tasks in prose.",
      },
      {
        id: "todo-verbs",
        label: "Create verbs + todo",
        triggers: ['"create/make/give me" + "todo/checklist/task list"'],
        patterns: [
          String.raw`\b(create|make|build|...)\b.{0,40}\b(to[- ]?do|checklist|task\s*list)\b`,
        ],
      },
      {
        id: "todo-manual",
        label: "Manual placement",
        triggers: ["User picks To-do list from the canvas placement menu"],
      },
    ],
    promptGuidance:
      "When the user asks for a to-do list, task list, or checklist, call emit_artifact with type todo. Do not use table for simple checklists.",
    validation: ["data.items: each { label, checked } required"],
    examples: [
      "Make me a packing list for Japan",
      "Create a todo list for visa appointment prep",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "calendar",
    label: "Calendar",
    summary: "Month grid with highlighted dates and all-day events.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior: "Auto-spawns when calendar intent detected; priority 15.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Scheduling or date intent detected",
    permissionCopy: getPermissionCopy("calendar"),
    rules: [
      {
        id: "calendar-dates",
        label: "Date mentions",
        triggers: [
          "ISO dates (YYYY-MM-DD), numeric dates, month-name dates",
          "Schedule, appointment, deadline, meeting on…",
        ],
        mandatoryNote:
          "MUST call emit_artifact type calendar. Set viewYear/viewMonth, highlightedDates, events.",
      },
      {
        id: "calendar-request",
        label: "Calendar request",
        triggers: [
          '"show/create calendar", "calendar for/of/view", "on my calendar"',
        ],
      },
      {
        id: "calendar-manual",
        label: "Manual placement",
        triggers: ["User picks Calendar from the placement menu"],
      },
    ],
    promptGuidance:
      "Use calendar for month-grid scheduling views. Use timeline for horizontal event chronologies.",
    validation: [
      "data.viewYear, data.viewMonth required",
      "data.highlightedDates as YYYY-MM-DD strings",
      "data.events: { title, startDate, endDate }",
    ],
    examples: ["Show me a calendar for June 2026", "Schedule meeting on March 15"],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "timeline",
    label: "Timeline",
    summary: "Horizontal chronological axis with dated text events.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior: "Auto-spawns when timeline intent detected; priority 18.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Chronology or roadmap intent detected",
    permissionCopy: getPermissionCopy("timeline"),
    rules: [
      {
        id: "timeline-keywords",
        label: "Chronology keywords",
        triggers: [
          "timeline, chronology, history of, roadmap, milestones",
          "era by era, over time, through the years",
        ],
        mandatoryNote:
          "MUST call emit_artifact type timeline. Events in data.events as { label, at } — max 10 words per label.",
      },
      {
        id: "timeline-vs-chart",
        label: "Disambiguation",
        triggers: [
          "Timeline wins over chart unless user says chart/graph/plot",
          "Numeric series → chart, not timeline",
        ],
      },
      {
        id: "timeline-manual",
        label: "Manual placement",
        triggers: ["User picks Timeline from the placement menu"],
      },
    ],
    promptGuidance:
      "Use timeline for chronology, history over time, roadmap, milestones. Not for numeric series.",
    validation: [
      "data.events: { label, at } with ISO 8601 dates",
      "Label max 10 words per event",
    ],
    examples: [
      "Build a timeline of the Roman Empire",
      "Roadmap milestones for Q1–Q4 product launch",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "chart",
    label: "Chart",
    summary: "Data visualizations — bar, line, area, pie, gauge.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior: "Auto-spawns when chart intent detected; priority 18 tier.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Data-viz, trend, or comparison intent",
    permissionCopy: getPermissionCopy("chart"),
    rules: [
      {
        id: "chart-viz",
        label: "Explicit visualization",
        triggers: ["chart, graph, plot, visualize, data viz"],
        mandatoryNote:
          "Call fetch_chart_data (unless user pasted numbers), then emit_artifact type chart.",
      },
      {
        id: "chart-trends",
        label: "Trends + numbers",
        triggers: [
          "over time, trends, growth, since YYYY, past N days/months/years",
          "Combined with revenue, sales, metrics, statistics keywords",
        ],
      },
      {
        id: "chart-compare",
        label: "Comparisons",
        triggers: [
          "compare, versus, breakdown, proportion, percentage, distribution",
        ],
      },
      {
        id: "chart-personal",
        label: "Personal metrics",
        triggers: [
          "spending, budget, sleep, steps, weight, savings, habit, goal, progress",
          "Plus trend or comparison keywords",
        ],
      },
      {
        id: "chart-live",
        label: "Live data",
        triggers: [
          "today, latest, current, real-time → web_search then chart",
        ],
        mandatoryNote:
          "Use web_search once for latest numeric series, then emit_artifact type chart.",
      },
      {
        id: "chart-manual",
        label: "Manual placement",
        triggers: ["User picks Chart from the placement menu"],
      },
    ],
    promptGuidance:
      "Call fetch_chart_data for historical series; web_search only for current/live data. Pick chartType by data shape.",
    validation: [
      "data.chartType: bar | line | area | pie | gauge",
      "Bar/line/area: categories + series",
      "Pie: slices; gauge: gaugeValue, gaugeMax",
    ],
    examples: [
      "Chart EV sales growth since 2018",
      "Visualize my monthly spending breakdown",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "table",
    label: "Table",
    summary: "Tabular data with columns and rows.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior:
      "Auto-spawns when table intent detected; beats map/travel keywords; priority 20.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Tabular or top-N intent detected",
    permissionCopy: getPermissionCopy("table"),
    rules: [
      {
        id: "table-explicit",
        label: "Explicit table",
        triggers: ['"in a table", "as a table", "table format", "tabular"'],
        mandatoryNote:
          "MUST call emit_artifact type table. Full columns/rows. Do not also emit map unless asked.",
      },
      {
        id: "table-request",
        label: "Create + table",
        triggers: [
          '"give/show/create" + "table/columns/rows"',
          '"top N" or "compare" + table/columns',
        ],
      },
      {
        id: "table-vs-map",
        label: "Priority over map",
        triggers: [
          "Table intent wins in resolvePrimaryArtifactKind before map/calendar",
        ],
      },
      {
        id: "table-manual",
        label: "Manual placement",
        triggers: ["User picks Table from the placement menu"],
      },
    ],
    promptGuidance:
      "Use table for tabular data, metrics, comparisons. Not for simple checklists (use todo).",
    validation: ["data.columns: { key, label }", "data.rows keyed by column keys"],
    examples: [
      "Compare EU countries in a table",
      "Top 10 programming languages as a table",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "custom",
    label: "Custom UI",
    summary: "Interactive HTML/CSS/JS widgets — timers, forms, dashboards.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior: "Auto-spawns when custom UI intent detected; priority 50.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Interactive UI or widget intent detected",
    permissionCopy: getPermissionCopy("custom"),
    rules: [
      {
        id: "custom-ui",
        label: "Interactive UI",
        triggers: [
          "interactive, widget, dashboard, timer, clock, calculator, form, app",
          '"build/create" + interactive/widget/ui',
        ],
        mandatoryNote:
          "MUST call emit_artifact type custom. Full UI in data.html, data.css, optional data.js.",
      },
      {
        id: "custom-style",
        label: "Theme / style edits",
        triggers: [
          "theme, color scheme, palette, styling, restyle, recolor",
          "dark mode, light mode, make it bigger/smaller",
        ],
        mandatoryNote:
          "For style-only edits: change data.css only — copy html/js verbatim.",
      },
      {
        id: "custom-inline",
        label: "Inline React source",
        triggers: [
          "User pastes React component source (import from react, useState, etc.)",
        ],
        mandatoryNote:
          "Convert to vanilla UI in data.html/css/js. Prose alone does not create artifact.",
      },
      {
        id: "custom-manual",
        label: "Manual placement",
        triggers: ["Not in manual menu — AI-generated only from chat"],
      },
    ],
    promptGuidance:
      "Use custom for interactive UI (timer, form, dashboard). Not for date calendars. Self-contained: no external scripts or fetch.",
    validation: [
      "data.html required, non-empty",
      "Max byte size enforced (customArtifact)",
    ],
    examples: [
      "Build a 5-minute countdown timer",
      "Create an interactive budget dashboard",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/customArtifactShortcuts.ts",
    ],
  }),
  entry({
    kind: "map",
    label: "Map",
    summary: "Geographic preview of a place with optional saved pins.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior: "Auto-spawns when travel/geography intent detected; priority 30.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Travel or geography intent detected",
    permissionCopy: getPermissionCopy("map"),
    rules: [
      {
        id: "map-travel",
        label: "Travel intent",
        triggers: [
          "travel, trip, visit, vacation, holiday, itinerary, destination, journey",
          "flight to, flying to, road trip, backpacking",
        ],
      },
      {
        id: "map-geography",
        label: "Geography",
        triggers: [
          "country, city, state, region, geography, where is, capital of",
        ],
      },
      {
        id: "map-vs-table",
        label: "When not to use",
        triggers: [
          "User asked for table → use table, not map",
          "User only wants photos → search_images",
        ],
      },
      {
        id: "map-manual",
        label: "Manual placement",
        triggers: ["User picks Map from the placement menu"],
      },
    ],
    promptGuidance:
      "Call emit_artifact type map when geography preview is the primary deliverable. Follow-ups update in place.",
    validation: [
      "data.place.name required — geocodable string",
      "Server geocodes via geocodeMapArtifact",
    ],
    examples: ["I'm planning a trip to Kyoto", "Where is Estonia located?"],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "streetview",
    label: "Street View",
    summary: "Google Street View at a specific named venue.",
    creationPaths: ["ai-intent", "manual", "llm-prompt"],
    autoSpawnBehavior:
      "May spawn alongside map in same turn; priority 40. Often permission preview if map already spawned.",
    spawnTiming: "permission-preview",
    spawnTrigger: "Named venue in travel context",
    permissionCopy: getPermissionCopy("streetview"),
    rules: [
      {
        id: "streetview-venue",
        label: "Venue keywords",
        triggers: [
          "station, metro, airport, terminal, museum, hotel, restaurant",
          "landmark, neighborhood, address, at the, near the",
        ],
      },
      {
        id: "streetview-named",
        label: "Named venue pattern",
        triggers: [
          "Proper-noun + station/metro/airport/museum/hotel/palace/etc.",
        ],
        patterns: [
          String.raw`\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s+(station|metro|airport|...)\b`,
        ],
      },
      {
        id: "streetview-pair",
        label: "Pairs with map",
        triggers: [
          "LLM may emit both map and streetview in one turn for travel context",
        ],
      },
      {
        id: "streetview-manual",
        label: "Manual placement",
        triggers: ["User picks Street view from the placement menu"],
      },
    ],
    promptGuidance:
      "When user names a specific venue in travel context, emit streetview for that exact place.",
    validation: [
      "data.place.name required",
      "Geocode + normalizeStreetViewArtifactData server-side",
    ],
    examples: [
      "Show me South Kensington station",
      "Street view at the Eiffel Tower",
    ],
    sourceFiles: [
      "lib/artifactIntent.ts",
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "code",
    label: "Code",
    summary: "One or more source files with paths and language tags.",
    creationPaths: ["llm-prompt"],
    autoSpawnBehavior: "Spawns via LLM emit_artifact; priority 60.",
    spawnTiming: "llm-emit",
    spawnTrigger: "Model emits code in its answer",
    permissionCopy: getPermissionCopy("code"),
    rules: [
      {
        id: "code-llm",
        label: "LLM emission",
        triggers: [
          "User asks for source code, implementation, scripts with file paths",
        ],
      },
    ],
    promptGuidance:
      "Use type code with data.files: [{ path, language, content }]. Any text format with accurate extensions.",
    validation: ["data.files array with path, language, content"],
    examples: ["Write a Python script for CSV parsing", "Show me the React component code"],
    sourceFiles: ["lib/artifactPrompt.ts", "app/api/chat/route.ts"],
  }),
  entry({
    kind: "images",
    label: "Images",
    summary: "Photo galleries — Wikimedia search or YouTube embed grid.",
    creationPaths: ["search-images", "url-paste", "manual", "llm-prompt"],
    autoSpawnBehavior: "Priority 70. YouTube URL paste creates images payload directly.",
    spawnTiming: "ai-auto",
    spawnTrigger: "Photo request or image search intent",
    permissionCopy: getPermissionCopy("images"),
    rules: [
      {
        id: "images-search",
        label: "Wikimedia search",
        triggers: [
          "Real photographs of existing places, people, or things",
          "AI calls search_images tool, not emit_artifact for photos",
        ],
      },
      {
        id: "images-youtube",
        label: "YouTube URL",
        triggers: ["Paste YouTube URL → images artifact with embed items"],
      },
      {
        id: "images-video-emit",
        label: "Video emit",
        triggers: [
          'LLM emit_artifact type "video" stored as images with YouTube items',
        ],
      },
      {
        id: "images-manual",
        label: "Manual placement",
        triggers: ["User picks Images from the placement menu"],
      },
    ],
    promptGuidance:
      "Use search_images for real photos. Use emit_artifact video for YouTube grids. Creative AI art uses image-generation MCP, not search_images.",
    examples: ["Photos of the Northern Lights", "https://youtube.com/watch?v=…"],
    sourceFiles: [
      "lib/artifactPrompt.ts",
      "lib/urlDetection.ts",
      "lib/manualArtifactMenu.ts",
    ],
  }),
  entry({
    kind: "video",
    label: "Video (emit)",
    summary: "LLM emission type for YouTube grids — stored as images payload.",
    creationPaths: ["llm-prompt"],
    autoSpawnBehavior: "Normalized to images artifact on the canvas.",
    spawnTiming: "llm-emit",
    spawnTrigger: "Model emits a YouTube video grid",
    rules: [
      {
        id: "video-emit",
        label: "YouTube grid",
        triggers: ["User shares YouTube or video URLs for a grid layout"],
      },
    ],
    promptGuidance:
      'emit_artifact type "video" with data.items: [{ url, thumb, title }]. Stored as images-style artifact.',
    validation: ["videoPayloadToImages normalization"],
    examples: ["Embed these YouTube tutorials in a grid"],
    sourceFiles: ["lib/artifactTypes.ts", "lib/artifactPrompt.ts"],
  }),
  entry({
    kind: "3d",
    label: "3D model",
    summary: "glb/gltf 3D model preview.",
    creationPaths: ["llm-prompt", "manual"],
    autoSpawnBehavior: "Priority 80.",
    spawnTiming: "llm-emit",
    spawnTrigger: "Model emits a glb/gltf model URL",
    permissionCopy: getPermissionCopy("3d"),
    rules: [
      {
        id: "3d-llm",
        label: "LLM emission",
        triggers: ["User provides or requests a 3D model URL (glb/gltf)"],
      },
      {
        id: "3d-manual",
        label: "Manual placement",
        triggers: ["User picks 3D model from the placement menu"],
      },
    ],
    promptGuidance: 'emit_artifact type "3d" with model URL.',
    validation: ["normalizeThreeDArtifactData"],
    examples: ["Show this glb model: https://…"],
    sourceFiles: [
      "lib/artifactPrompt.ts",
      "lib/manualArtifactMenu.ts",
      "app/api/chat/route.ts",
    ],
  }),
  entry({
    kind: "website",
    label: "Website",
    summary: "Generic website preview for HTTP(S) URLs.",
    creationPaths: ["url-paste"],
    autoSpawnBehavior: "Instant spawn on URL paste — no chat turn required.",
    spawnTiming: "instant",
    spawnTrigger: "Paste any non-special HTTP(S) URL",
    rules: [
      {
        id: "website-fallback",
        label: "Generic URL",
        triggers: [
          "Any normalized HTTP(S) URL that is not YouTube, GitHub repo, Google Drive, or known embed provider",
        ],
      },
    ],
    validation: ["normalizeWebsiteArtifactData"],
    examples: ["https://example.com", "https://docs.react.dev"],
    sourceFiles: ["lib/urlDetection.ts", "lib/createUrlArtifact.ts"],
  }),
  entry({
    kind: "repo",
    label: "GitHub repo",
    summary: "Repository explorer for GitHub URLs.",
    creationPaths: ["url-paste"],
    autoSpawnBehavior: "Instant spawn on GitHub repo URL paste.",
    spawnTiming: "instant",
    spawnTrigger: "Paste URL matching parseGithubRepoUrl",
    rules: [
      {
        id: "repo-github",
        label: "GitHub URL",
        triggers: ["Paste URL matching parseGithubRepoUrl"],
      },
    ],
    examples: ["https://github.com/vercel/next.js"],
    sourceFiles: [
      "lib/urlDetection.ts",
      "lib/createUrlArtifact.ts",
      "lib/github/parseRepoUrl.ts",
    ],
  }),
  entry({
    kind: "embed",
    label: "Embed",
    summary: "Rich embeds for supported social/content platforms.",
    creationPaths: ["url-paste"],
    autoSpawnBehavior: "Instant spawn when URL matches an embed provider.",
    spawnTiming: "instant",
    spawnTrigger: "Paste URL matching a supported embed provider",
    rules: [
      {
        id: "embed-providers",
        label: "Supported providers",
        triggers: [
          "Reddit, Twitter/X, Instagram, Facebook, Medium, Substack, Figma",
        ],
      },
    ],
    examples: [
      "https://twitter.com/user/status/…",
      "https://reddit.com/r/…",
    ],
    sourceFiles: ["lib/embed/registry.ts", "lib/urlDetection.ts"],
  }),
  entry({
    kind: "google-doc",
    label: "Google Doc",
    summary: "Google Drive / Docs preview.",
    creationPaths: ["url-paste"],
    autoSpawnBehavior: "Instant spawn on Google Drive URL; may require Google connect.",
    spawnTiming: "instant",
    spawnTrigger: "Paste URL matching parseGoogleDriveUrl",
    rules: [
      {
        id: "google-drive",
        label: "Drive URL",
        triggers: ["Paste URL matching parseGoogleDriveUrl"],
      },
    ],
    examples: ["https://docs.google.com/document/d/…"],
    sourceFiles: [
      "lib/urlDetection.ts",
      "lib/google/parseDriveUrl.ts",
      "lib/createUrlArtifact.ts",
    ],
  }),
  entry({
    kind: "audio",
    label: "Audio",
    summary: "Waveform input artifact from dropped audio files.",
    creationPaths: ["file-drop"],
    autoSpawnBehavior: "Instant spawn on canvas audio drop — no chat turn.",
    spawnTiming: "instant",
    spawnTrigger: "Drop an audio file onto the canvas",
    rules: [
      {
        id: "audio-formats",
        label: "Allowed formats",
        triggers: [
          "MP3, WAV, M4A/AAC, OGG, WebM audio",
          "Excludes FLAC, AIFF, video, MIDI, WMA",
        ],
      },
      {
        id: "audio-size",
        label: "Size limit",
        triggers: ["Max 10 MB (AUDIO_ASSET_MAX_BYTES)"],
      },
    ],
    validation: [
      "isAudioFile check in lib/audioArtifact.ts",
      "Time-proportional waveform width (4px/second)",
    ],
    examples: ["Drop podcast.mp3 onto canvas"],
    sourceFiles: [
      "lib/audioArtifact.ts",
      "lib/attachments.ts",
      ".cursor/rules/waveform-input-artifact.mdc",
    ],
  }),
  entry({
    kind: "stickynote",
    label: "Sticky note",
    summary: "Colored sticky note — manual placement only.",
    creationPaths: ["manual"],
    autoSpawnBehavior: "Instant spawn from placement menu.",
    spawnTiming: "instant",
    spawnTrigger: "Pick Sticky note from the canvas placement menu",
    rules: [
      {
        id: "stickynote-manual",
        label: "Manual only",
        triggers: ["User picks Sticky note from the canvas placement menu"],
      },
    ],
    examples: ["Place a sticky note on the canvas"],
    sourceFiles: ["lib/manualArtifactMenu.ts", "lib/manualArtifactDefaults.ts"],
  }),
];

export function getCatalogStats() {
  const total = ARTIFACT_INTENT_CATALOG.length;
  const withAiIntent = ARTIFACT_INTENT_CATALOG.filter((e) =>
    e.creationPaths.includes("ai-intent"),
  ).length;
  const manualOnly = ARTIFACT_INTENT_CATALOG.filter(
    (e) =>
      e.creationPaths.length === 1 && e.creationPaths[0] === "manual",
  ).length;
  return { total, withAiIntent, manualOnly };
}

export type PathFilter =
  | "all"
  | "ai-intent"
  | "llm-prompt"
  | "url-paste"
  | "manual"
  | "file-drop";

export function filterCatalogEntries(
  entries: ArtifactIntentEntry[],
  search: string,
  pathFilter: PathFilter,
): ArtifactIntentEntry[] {
  const q = search.trim().toLowerCase();
  return entries.filter((entry) => {
    if (pathFilter !== "all") {
      const pathMatch =
        pathFilter === "file-drop"
          ? entry.creationPaths.includes("file-drop")
          : entry.creationPaths.includes(pathFilter);
      if (!pathMatch) return false;
    }
    if (!q) return true;
    const haystack = [
      entry.kind,
      entry.label,
      entry.summary,
      entry.promptGuidance ?? "",
      ...entry.rules.flatMap((r) => [r.label, ...r.triggers]),
      ...(entry.examples ?? []),
      ...entry.sourceFiles,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
