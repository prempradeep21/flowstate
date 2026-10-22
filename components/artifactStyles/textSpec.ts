import type { StudioArtifact } from "@/lib/artifactStudio/pool";

/**
 * The text an artifact carries — the same parts in every style family.
 *
 * Families decide how a part looks, never whether it is there: a line chart
 * is a title, a figure, a note on the figure, a legend when there is more
 * than one series, and axis labels — in Frost, Aurora and the rest.
 * Text a style invents for itself (a kind kicker like "Line chart", a serial
 * like "No. A978", counts like "19 points" or "9 rows") is not a part.
 *
 * Families tag every text they draw with its part: `data-el={ROLE.title}` on
 * the element or a wrapper around it. Everything under one tag is one part,
 * so a title split over two typographic lines is still one Title. The
 * Elements panel and `scratch/text-parity.mjs` check each family against
 * `textSpecFor`. Glyphs (→, “ ”, ‹ ›) and avatar initials are iconography,
 * not text — mark avatars `data-el-kind="icon"`.
 *
 * Current renders the live product byte-for-byte and is the reference, not
 * held to the spec.
 */

export const ROLE = {
  title: "Title",
  // table
  columnHeaders: "Column headers",
  cells: "Cells",
  // charts, stat, gauge — the computed headline: a figure and what it is
  figure: "Figure",
  figureNote: "Figure note",
  legend: "Legend",
  categoryLabels: "Category labels",
  valueLabels: "Value labels",
  axisLabels: "Axis labels",
  sliceLabels: "Slice labels",
  sliceValues: "Slice values",
  was: "Was",
  now: "Now",
  // mechanism
  stepNumbers: "Step numbers",
  stepLabels: "Step labels",
  stepNotes: "Step notes",
  // timeline, calendar
  eventDates: "Event dates",
  eventLabels: "Event labels",
  month: "Month",
  weekdays: "Weekdays",
  dayNumbers: "Day numbers",
  // todo
  progress: "Progress",
  itemLabels: "Item labels",
  dueDates: "Due dates",
  // media
  place: "Place",
  moreCount: "More count",
  duration: "Duration",
  domain: "Domain",
  // episode
  episodeTitle: "Episode title",
  description: "Description",
  chapterNumbers: "Chapter numbers",
  chapterLabels: "Chapter labels",
  // link group
  sectionLabels: "Section labels",
  linkLabels: "Link labels",
  // discourse
  note: "Note",
  quote: "Quote",
  speaker: "Speaker",
  sideLabels: "Side labels",
  claim: "Claim",
  pushback: "Pushback",
  speakers: "Speakers",
  gloss: "Gloss",
  example: "Example",
  // code
  fileNames: "File names",
  code: "Code",
  // cards — the question / heading is the Title
  answer: "Answer",
  summary: "Summary",
} as const;

export type TextRole = (typeof ROLE)[keyof typeof ROLE];

/** A gallery shows at most this many tiles; the rest are a "+n" count. */
export const GALLERY_VISIBLE = 3;
/** Bar charts label every bar's value up to this many bars. */
export const BAR_VALUE_LABELS_MAX = 8;

/** The parts this artifact's text is made of, in reading order. */
export function textSpecFor(item: StudioArtifact, familyId?: string): TextRole[] {
  const p = item.payload;
  const R = ROLE;
  const out: TextRole[] = [R.title];
  const add = (...roles: (TextRole | false | null | undefined)[]) => {
    for (const r of roles) if (r) out.push(r);
  };
  switch (p.type) {
    case "table":
      add(R.columnHeaders, R.cells);
      break;
    case "chart": {
      const d = p.data;
      const series = d.series ?? [];
      if (d.chartType === "pie") add(R.figure, R.figureNote, R.sliceLabels, R.sliceValues);
      else if (d.chartType === "gauge") add(R.figure, R.figureNote);
      else if (d.chartType === "bar")
        add(R.figure, R.figureNote, series.length > 1 && R.legend, R.categoryLabels, (d.categories?.length ?? 0) <= BAR_VALUE_LABELS_MAX && R.valueLabels);
      // Frost's line chart drops the pill over the graph — the figure says it.
      else add(R.figure, !(familyId === "style-d" && d.chartType === "line") && R.figureNote, series.length > 1 && R.legend, R.axisLabels);
      break;
    }
    case "stat":
      add(R.figure, R.figureNote, p.data.delta && R.was, p.data.delta && R.now);
      break;
    case "mechanism":
      add(R.stepNumbers, R.stepLabels, p.data.steps.some((s) => s.note?.trim()) && R.stepNotes);
      break;
    case "timeline":
      add(R.eventDates, R.eventLabels);
      break;
    case "calendar":
      add(R.month, R.weekdays, R.dayNumbers, p.data.events.length > 0 && R.eventDates, p.data.events.length > 0 && R.eventLabels);
      break;
    case "todo":
      add(R.progress, R.itemLabels, p.data.items.some((i) => i.dueDate) && R.dueDates);
      break;
    case "map":
      // The live map body labels its place; families wrap that body in this tag.
      add(R.place);
      break;
    case "images":
      add(p.data.items.length > GALLERY_VISIBLE && R.moreCount);
      break;
    case "audio":
      add(R.duration);
      break;
    case "website":
      add(R.domain);
      break;
    case "episode":
      add(R.episodeTitle, !!p.data.description?.trim() && R.description, p.data.chapters.length > 0 && R.chapterNumbers, p.data.chapters.length > 0 && R.chapterLabels);
      break;
    case "linkgroup":
      add(R.sectionLabels, R.linkLabels);
      break;
    case "stickynote":
      add(R.note);
      break;
    case "quote":
      add(R.quote, R.speaker);
      break;
    case "claim":
      add(R.sideLabels, R.claim, R.pushback, R.speakers);
      break;
    case "definition":
      add(R.gloss, !!p.data.example?.trim() && R.example, !!p.data.speaker?.trim() && R.speaker);
      break;
    case "code":
      add(R.fileNames, R.code);
      break;
    case "qa":
      add(R.answer);
      break;
    case "conversation":
      add(R.summary);
      break;
    default:
      // street view, video, 3D, embed, custom, docs, repo — the title; the rest is media.
      break;
  }
  return out;
}

/** Families held to the spec — everything but the live product reference. */
export const SPEC_EXEMPT_FAMILIES = new Set(["current"]);

export interface SpecCheck {
  missing: TextRole[];
  extra: string[];
  untagged: string[];
}

/** Compares the parts found on a rendered artifact with its spec. */
export function checkSpec(
  item: StudioArtifact,
  found: { name: string; tagged: boolean; snippet: string; kind: "text" | "icon" }[],
  familyId?: string,
): SpecCheck {
  const spec = textSpecFor(item, familyId);
  const text = found.filter((f) => f.kind === "text");
  const tagged = new Set(text.filter((f) => f.tagged).map((f) => f.name));
  return {
    missing: spec.filter((r) => !tagged.has(r)),
    extra: [...tagged].filter((n) => !(spec as string[]).includes(n)),
    untagged: text.filter((f) => !f.tagged).map((f) => `${f.name}: ${f.snippet.slice(0, 40)}`),
  };
}
