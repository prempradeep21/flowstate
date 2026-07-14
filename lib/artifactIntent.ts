/** Detect when the user wants a to-do / checklist artifact from their message. */

import type { ArtifactKind } from "@/lib/artifactTypes";

const TODO_INTENT =
  /\b(to[- ]?do\s*list|todo\s*list|checklist|task\s*list|action\s*items?|things?\s+to\s+(?:do|bring|pack|prepare)|get\s+ready|packing\s+list|prep\s+list)\b/i;

const TODO_VERBS =
  /\b(create|make|build|generate|give\s+me|show\s+me|need)\b.{0,40}\b(to[- ]?do|checklist|task\s*list)\b/i;

const TODO_ARTIFACT =
  /\b(to[- ]?do|checklist|task\s*list)\s+(artifact|component)\b/i;

export function detectTodoListIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return TODO_INTENT.test(q) || TODO_VERBS.test(q) || TODO_ARTIFACT.test(q);
}

export const TODO_INTENT_SYSTEM_NOTE = `
MANDATORY — To-do list request detected:
- You MUST call emit_artifact with type "todo" in this turn.
- Put every task in data.items as { label, checked: false } (add dueDate/priority when useful).
- Keep your text reply to 1–2 short sentences — do NOT list the tasks in prose; the artifact is the deliverable.
- Use a descriptive title, e.g. "UK Visa Appointment Checklist".
`.trim();

/** Detect when the user mentions dates or wants a calendar artifact. */

const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const NUMERIC_DATE = /\b\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?\b/;
const MONTH_NAME =
  /(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i;
const MONTH_DAY_DATE = new RegExp(
  `\\b${MONTH_NAME.source}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?\\b`,
  "i",
);
const DAY_MONTH_DATE = new RegExp(
  `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NAME.source}(?:\\s+\\d{4})?\\b`,
  "i",
);
const SCHEDULE_INTENT =
  /\b(?:schedule|appointment|deadline|meeting\s+on|event\s+on|on\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?|from\s+.+?\s+to\s+)\b/i;
const CALENDAR_REQUEST =
  /\b(?:show|build|create|make|give\s+me|need|open)\b.{0,40}\bcalendar\b|\bcalendar\s+(?:for|of|view|grid)\b|\bon\s+my\s+calendar\b|\bmy\s+calendar\b/i;
const CALENDAR_ARTIFACT =
  /\bcalendar\s+(artifact|view|component)\b/i;

export function detectCalendarIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    ISO_DATE.test(q) ||
    NUMERIC_DATE.test(q) ||
    MONTH_DAY_DATE.test(q) ||
    DAY_MONTH_DATE.test(q) ||
    CALENDAR_REQUEST.test(q) ||
    SCHEDULE_INTENT.test(q) ||
    CALENDAR_ARTIFACT.test(q)
  );
}

export const CALENDAR_INTENT_SYSTEM_NOTE = `
MANDATORY — Calendar / date request detected:
- You MUST call emit_artifact with type "calendar" in this turn.
- Set data.viewYear and data.viewMonth to the primary month referenced (or current month if unclear).
- Put every date mentioned in data.highlightedDates as "YYYY-MM-DD".
- When event titles or ranges are known, add data.events as { title, startDate, endDate } (endDate inclusive; same as startDate for single days).
- Keep your text reply to 1–2 short sentences — the calendar artifact is the deliverable.
`.trim();

export const CALENDAR_THINKING_LABEL = "Preparing calendar…";

/** Detect when the user wants a horizontal timeline / chronology artifact. */

const TIMELINE_INTENT =
  /\b(timeline|chronolog(?:y|ical)|history\s+of|roadmap|milestones?|era\s+by\s+era|over\s+time|through\s+the\s+years)\b/i;

const TIMELINE_ARTIFACT =
  /\btimeline\s+(artifact|view|component)\b/i;

export function detectTimelineIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return TIMELINE_INTENT.test(q) || TIMELINE_ARTIFACT.test(q);
}

export const TIMELINE_INTENT_SYSTEM_NOTE = `
MANDATORY — Timeline request detected:
- You MUST call emit_artifact with type "timeline" in this turn.
- Put events in data.events as { label, at } where at is ISO 8601 and label is text only (max 10 words each).
- Default data.scale to "year" unless the user asks for months or days.
- Keep your text reply to 1–2 short sentences — the timeline artifact is the deliverable.
`.trim();

export const TIMELINE_EDIT_SYSTEM_NOTE = `
The user is editing an existing timeline artifact. When they ask to add or change events:
- Call emit_artifact with type "timeline" and the FULL data.events array (preserve existing events unless asked to remove).
- Each event label must be text only, max 10 words.
- Use ISO 8601 for at on every event.
`.trim();

export const TIMELINE_THINKING_LABEL = "Building timeline…";

export const STREET_VIEW_EDIT_SYSTEM_NOTE = `
The user is editing an existing Street View artifact. Keep this fast and minimal:
- Call emit_artifact with type "streetview" and the FULL updated payload.
- Only change the fields the user asked about (usually heading 0–360, pitch -90–90, fov 10–120, or place.name).
- Preserve the existing place — keep place.name AND its lat/lng unless the user is moving to a genuinely different location. Do not drop or invent coordinates.
- Do NOT re-describe the location at length. Reply with one short sentence (max ~15 words) confirming the change.
`.trim();

/** Detect when the user wants an interactive custom UI artifact. */

const CUSTOM_UI_INTENT =
  /\b(interactive|widget|component|dashboard|timer|clock|calculator|counter|stopwatch|countdown|form|ui|app)\b/i;

const CUSTOM_BUILD_VERBS =
  /\b(build|create|make|design|show|develop)\b.{0,48}\b(interactive|widget|component|ui|timer|clock|dashboard|app)\b/i;

const CUSTOM_ARTIFACT =
  /\b(interactive|custom|widget)\s+(artifact|component|ui)\b/i;

const CUSTOM_STYLE_EDIT =
  /\b(theme|themed|color\s*scheme|colour\s*scheme|palette|styling|restyle|recolor|re-colou?r)\b/i;

const CUSTOM_VISUAL_TWEAK =
  /\b(black\s+and\s+white|monochrome|grayscale|greyscale|dark\s+(?:mode|theme)|light\s+(?:mode|theme)|make\s+it\s+(?:dark|light|bigger|smaller))\b/i;

export function detectCustomUiIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    CUSTOM_UI_INTENT.test(q) ||
    CUSTOM_BUILD_VERBS.test(q) ||
    CUSTOM_ARTIFACT.test(q) ||
    CUSTOM_STYLE_EDIT.test(q) ||
    CUSTOM_VISUAL_TWEAK.test(q)
  );
}

export function detectInlineSourceInQuestion(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    /import\s+[\s\S]{0,160}\bfrom\s+['"]react['"]/i.test(q) ||
    /export\s+(default\s+)?function\s+\w+/i.test(q) ||
    (/\buseState\s*\(/.test(q) && /\breturn\s*\(/.test(q))
  );
}

export const CUSTOM_UI_INLINE_CODE_NOTE = `
MANDATORY — Inline source code detected in the user message:
- You MUST call emit_artifact with type "custom" and put the converted vanilla UI in data.html, data.css, and optional data.js.
- Prose descriptions alone do NOT create an artifact — nothing appears on the canvas until emit_artifact succeeds with non-empty data.html.
- Keep the text reply to one short sentence; put ALL markup, styles, and scripts in the tool payload.
`.trim();

/** True when the turn should produce or update a custom UI artifact. */
export function isCustomUiWork(
  question: string,
  editingPayload?: { type?: string } | null,
): boolean {
  return detectCustomUiIntent(question) || editingPayload?.type === "custom";
}

export const CUSTOM_UI_THINKING_LABEL = "Building custom component…";

export const CUSTOM_UI_UPDATING_LABEL = "Updating custom component…";

export const CUSTOM_UI_INTENT_SYSTEM_NOTE = `
MANDATORY — Custom interactive UI request detected:
- You MUST call emit_artifact with type "custom" in this turn.
- Put the full UI in data.html, data.css, and optional data.js.
- Keep your text reply to 1–2 short sentences — the artifact is the deliverable.
- Prefer CSS for visual styling; use JS only when interactivity requires it.
`.trim();

export const CUSTOM_UI_EDIT_SYSTEM_NOTE = `
MANDATORY — Custom UI edit detected:
- You MUST call emit_artifact with type "custom" and the FULL updated payload in this turn.
- Preserve the artifact title unless the user asks to rename it.
- For theme, color, palette, or styling-only requests: change data.css only — copy data.html and data.js verbatim from the current artifact.
- For behavior or layout changes: update only the parts that must change; keep everything else identical.
- Keep your text reply to 1–2 short sentences.
`.trim();

const TRAVEL_MAP_INTENT =
  /\b(travel|trip|visit(?:ing)?|vacation|holiday|itinerary|destination|journey|backpack(?:ing)?|road\s*trip|flight\s+to|flying\s+to)\b/i;

const GEOGRAPHY_INTENT =
  /\b(country|countries|city|cities|state|province|region|geography|where\s+is|located\s+in|capital\s+of)\b/i;

const SPECIFIC_PLACE_INTENT =
  /\b(station|metro|subway|airport|terminal|museum|hotel|restaurant|café|cafe|landmark|neighborhood|district|address|at\s+the|near\s+the|in\s+front\s+of)\b/i;

const NAMED_VENUE =
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s+(station|metro|airport|museum|hotel|palace|cathedral|bridge|market)\b/;

export function detectTravelMapIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return TRAVEL_MAP_INTENT.test(q) || GEOGRAPHY_INTENT.test(q);
}

export function detectSpecificPlaceIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return SPECIFIC_PLACE_INTENT.test(q) || NAMED_VENUE.test(q);
}

export const MAP_THINKING_LABEL = "Preparing map…";

/** Detect chart / data visualization intent from the user message. */

const CHART_TREND_INTENT =
  /\b(over\s+time|trend|trends|history|growth|decline|increase|decreas(?:e|ing)|since\s+\d{4}|past\s+\d+\s+(?:days?|weeks?|months?|years?))\b/i;

const CHART_COMPARE_INTENT =
  /\b(compare|comparison|versus|vs\.?|breakdown|split|proportion|percentage|percent|how\s+much|per\s+month|by\s+category|distribution)\b/i;

const CHART_VIZ_INTENT =
  /\b(chart|graph|plot|visuali[sz]e|show\s+me\s+the\s+numbers?|data\s+viz)\b/i;

const CHART_PERSONAL_INTENT =
  /\b(spending|budget|sleep|steps|weight|savings|habit|goal|progress|track(?:ing)?)\b/i;

const CHART_NUMERIC_KEYWORD =
  /\b(revenue|sales|growth|graph|chart|bar|line|area|pie|numbers?|statistics|data|metric|percent|rate)\b/i;

export function detectChartIntent(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  if (detectTimelineIntent(q) && !CHART_VIZ_INTENT.test(q)) return false;
  if (CHART_VIZ_INTENT.test(q)) return true;
  if (
    CHART_PERSONAL_INTENT.test(q) &&
    (CHART_TREND_INTENT.test(q) || CHART_COMPARE_INTENT.test(q))
  ) {
    return true;
  }
  if (CHART_TREND_INTENT.test(q) && CHART_NUMERIC_KEYWORD.test(q)) return true;
  if (CHART_COMPARE_INTENT.test(q) && CHART_VIZ_INTENT.test(q)) return true;
  return false;
}

export const CHART_FETCH_INTENT_SYSTEM_NOTE = `
MANDATORY — Chart / trend request detected:
- First call fetch_chart_data to gather numeric series (unless the user already pasted complete numbers in their message).
- Then call emit_artifact with type "chart" and a populated data payload.
- Pick chartType: line for time trends; area for filled/cumulative trends; bar for category comparison; pie for share-of-whole; gauge for single goal progress.
- data shape: bar/line/area use data.categories + data.series[{ name, data[] }]; pie uses data.slices[{ name, value }]; gauge uses data.gaugeValue, data.gaugeMax, data.gaugeLabel.
- Keep text reply to 1–2 sentences; the chart is the deliverable.
- Include data.source when numbers came from research.
`.trim();

export const CHART_LIVE_INTENT_SYSTEM_NOTE = `
MANDATORY — Chart with live/current data detected:
- Use web_search once to gather the latest numeric series, then call emit_artifact with type "chart".
- Pick chartType: line for time trends; area for filled/cumulative trends; bar for category comparison; pie for share-of-whole; gauge for single goal progress.
- data shape: bar/line/area use data.categories + data.series[{ name, data[] }]; pie uses data.slices[{ name, value }]; gauge uses data.gaugeValue, data.gaugeMax, data.gaugeLabel.
- Keep text reply to 1–2 sentences; the chart is the deliverable.
- Include data.source when numbers came from web research.
`.trim();

export const CHART_INTENT_SYSTEM_NOTE = CHART_FETCH_INTENT_SYSTEM_NOTE;

export const CHART_THINKING_LABEL = "Gathering data and building chart…";

/** Detect tabular list / comparison requests. */
const TABLE_EXPLICIT = /\bin a table\b|\bas a table\b|\btable format\b|\btabular\b/i;
const TABLE_REQUEST =
  /\b(give\s+me|show\s+me|create|make|build|put)\b.{0,48}\b(table|columns?|rows?)\b/i;
const TABLE_TOP_N =
  /\b(top\s+\d+|list\s+(?:the|of)|compare|comparison)\b.{0,80}\b(table|columns?|rows?)\b/i;
// Implicit tabular requests that never say the word "table" but clearly want a
// column/attribute grid: comparisons keyed on a spec noun, or a ranked list
// qualified by concrete attributes.
const TABLE_COMPARE =
  /\b(compare|comparison|vs\.?|versus)\b.{0,80}\b(specs?|specifications?|stats?|statistics|features?|pricing|prices?|plans?|options?|models?|dimensions?|attributes?|pros?\s+and\s+cons?)\b/i;
const TABLE_TOP_N_ATTRS =
  /\b(top\s+\d+|best\s+\d+|\d+\s+best|list\s+(?:the\s+)?\d+)\b.{0,80}\bwith\b.{0,80}\b(price|cost|rating|ranking|range|specs?|size|weight|year|score|stats?|population|revenue|capacity)\b/i;

export function detectTableIntent(question: string): boolean {
  const q = stripAppendedQuestionContext(question);
  if (!q) return false;
  return (
    TABLE_EXPLICIT.test(q) ||
    TABLE_REQUEST.test(q) ||
    TABLE_TOP_N.test(q) ||
    TABLE_COMPARE.test(q) ||
    TABLE_TOP_N_ATTRS.test(q)
  );
}

export const TABLE_INTENT_SYSTEM_NOTE = `
MANDATORY — Table request detected:
- You MUST call emit_artifact with type "table" in this turn.
- Put the full table in data.columns and data.rows.
- Do NOT also emit a map artifact unless the user explicitly asked for a map preview.
- Answer from your knowledge for evergreen lists and comparisons — do not use web_search.
- Keep your text reply to 1–2 short sentences.
`.trim();

export const TABLE_THINKING_LABEL = "Building table…";

/** True when the question needs current / time-sensitive web data. */
const LIVE_DATA_RECENCY =
  /\b(today|latest|current|currently|right now|as of now|this week|this month|breaking|live|real[- ]?time|now)\b/i;
const LIVE_DATA_YEAR = /\b(2025|2026)\b/;
const EXPLICIT_WEB_SEARCH =
  /\b(search the web|look up online|find current|browse for|google)\b/i;
const LIVE_DATA_FEEDS =
  /\b(stock price|weather today|news today|exchange rate today|market cap today)\b/i;
const HISTORICAL_SERIES =
  /\b(last\s+\d+\s+years?|past\s+\d+\s+years?|since\s+\d{4}|historical|over the last decade|ten years|10 years)\b/i;

export function detectLiveDataIntent(question: string): boolean {
  const q = stripAppendedQuestionContext(question);
  if (!q) return false;
  if (HISTORICAL_SERIES.test(q) && !LIVE_DATA_RECENCY.test(q)) return false;
  return (
    LIVE_DATA_RECENCY.test(q) ||
    LIVE_DATA_YEAR.test(q) ||
    EXPLICIT_WEB_SEARCH.test(q) ||
    LIVE_DATA_FEEDS.test(q)
  );
}

export const LIVE_DATA_SYSTEM_NOTE = `
Live data mode: web_search is available for this turn.
- Use web_search ONLY for current, time-sensitive facts not reliably in training data.
- Do NOT use web_search for historical series, evergreen travel lists, or well-known comparisons.
- Prefer at most one focused search query.
`.trim();

const APPENDED_CONTEXT_MARKERS = [
  "\n\nAttached asset context:",
  "\n\nAttached skill context:",
] as const;

/** User-authored question only — strips asset/skill blocks appended for the model. */
export function stripAppendedQuestionContext(question: string): string {
  let q = question;
  for (const marker of APPENDED_CONTEXT_MARKERS) {
    const index = q.indexOf(marker);
    if (index >= 0) q = q.slice(0, index);
  }
  return q.trim();
}

const EXPLICIT_ARTIFACT_KIND: Array<[RegExp, ArtifactKind]> = [
  [/\bcustom\s+(?:ui|UI)\s+artifact\b/i, "custom"],
  [
    /\b(?:interactive|custom)\s+(?:ui|UI)\s+(?:artifact|component)\b/i,
    "custom",
  ],
  [/\btodo\s+(?:artifact|list|component)\b/i, "todo"],
  [/\btimeline\s+(?:artifact|view|component)\b/i, "timeline"],
  [/\bcalendar\s+(?:artifact|view|component)\b/i, "calendar"],
  [/\bchart\s+(?:artifact|view|component)\b/i, "chart"],
  [/\bmap\s+artifact\b/i, "map"],
];

/** When the user names the artifact type directly, e.g. "custom UI artifact". */
export function detectExplicitArtifactKind(
  question: string,
): ArtifactKind | null {
  const q = stripAppendedQuestionContext(question);
  if (!q) return null;
  for (const [pattern, kind] of EXPLICIT_ARTIFACT_KIND) {
    if (pattern.test(q)) return kind;
  }
  return null;
}

const THINKING_LABEL_BY_KIND: Partial<Record<ArtifactKind, string>> = {
  todo: "Checking boxes…",
  calendar: CALENDAR_THINKING_LABEL,
  timeline: TIMELINE_THINKING_LABEL,
  chart: CHART_THINKING_LABEL,
  custom: CUSTOM_UI_THINKING_LABEL,
  map: MAP_THINKING_LABEL,
  table: TABLE_THINKING_LABEL,
};

/**
 * Primary artifact kind for loading copy and pending-artifact hints.
 * Explicit user requests and custom UI beat incidental keyword matches
 * (e.g. the word "calendar" in attached rules or system docs).
 */
export function resolvePrimaryArtifactKind(
  question: string,
  editingPayload?: { type?: string } | null,
): ArtifactKind | null {
  const q = stripAppendedQuestionContext(question);
  if (!q) return null;

  const explicit = detectExplicitArtifactKind(q);
  if (explicit) return explicit;

  if (isCustomUiWork(q, editingPayload)) return "custom";
  if (detectTodoListIntent(q)) return "todo";
  if (detectTableIntent(q)) return "table";
  if (detectTimelineIntent(q)) return "timeline";
  if (detectChartIntent(q)) return "chart";
  if (detectTravelMapIntent(q)) return "map";
  if (detectCalendarIntent(q)) return "calendar";
  if (detectSpecificPlaceIntent(q)) return "streetview";
  return null;
}

/**
 * Single intent system note for the primary artifact kind (avoids stacked
 * conflicting MANDATORY notes).
 */
export function resolvePrimaryIntentSystemNote(
  question: string,
  editingPayload?: { type?: string } | null,
  opts?: { useFetchChartData?: boolean; liveData?: boolean },
): string | null {
  if (editingPayload) return null;

  const kind = resolvePrimaryArtifactKind(question, editingPayload);
  switch (kind) {
    case "todo":
      return TODO_INTENT_SYSTEM_NOTE;
    case "calendar":
      return CALENDAR_INTENT_SYSTEM_NOTE;
    case "timeline":
      return TIMELINE_INTENT_SYSTEM_NOTE;
    case "chart":
      if (opts?.liveData) return CHART_LIVE_INTENT_SYSTEM_NOTE;
      if (opts?.useFetchChartData) return CHART_FETCH_INTENT_SYSTEM_NOTE;
      return CHART_FETCH_INTENT_SYSTEM_NOTE;
    case "custom":
      return CUSTOM_UI_INTENT_SYSTEM_NOTE;
    case "table":
      return TABLE_INTENT_SYSTEM_NOTE;
    default:
      return null;
  }
}

/** Status copy shown while the model turn is in flight. */
export function resolveInitialThinkingLabel(
  question: string,
  editingPayload?: { type?: string } | null,
): string {
  const kind = resolvePrimaryArtifactKind(question, editingPayload);
  if (kind === "custom" && editingPayload?.type === "custom") {
    return CUSTOM_UI_UPDATING_LABEL;
  }
  if (kind && THINKING_LABEL_BY_KIND[kind]) {
    return THINKING_LABEL_BY_KIND[kind]!;
  }
  return "Thinking";
}

/** Best-effort artifact kind the user explicitly asked for in their message. */
export function detectUserRequestedArtifactKind(
  question: string,
): ArtifactKind | null {
  return resolvePrimaryArtifactKind(question);
}
