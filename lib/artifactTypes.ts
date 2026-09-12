import { normalizeChartArtifactData } from "@/lib/chartArtifact";
import type { ChartArtifactData } from "@/lib/chartTypes";
import { normalizeCalendarArtifactData } from "@/lib/calendarArtifact";
import { normalizeCustomArtifactData } from "@/lib/customArtifact";
import type { RepoExplorerData } from "@/lib/github/types";
import { normalizeMapArtifactData } from "@/lib/mapArtifact";
import { normalizeStreetViewArtifactData } from "@/lib/streetViewArtifact";
import { normalizeThreeDArtifactData } from "@/lib/threeDArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import { normalizeTimelineArtifactData } from "@/lib/timelineArtifact";
import { normalizeTodoArtifactData } from "@/lib/todoArtifact";
import { normalizeWebsiteArtifactData } from "@/lib/websiteArtifact";
import { parseYoutubeId } from "@/lib/youtube";

/** Response shape for a single canvas card turn. */

export type ResponseType =
  | "text"
  | "image"
  | "video"
  | "table"
  | "code"
  | "custom"
  | "3d"
  | "images"
  | "todo"
  | "calendar"
  | "map"
  | "streetview"
  | "website"
  | "repo"
  | "embed"
  | "google-doc"
  | "timeline"
  | "chart"
  | "audio"
  | "stickynote"
  | "quote"
  | "stat"
  | "definition"
  | "claim"
  | "mechanism"
  | "episode"
  | "linkgroup";

/** UI routing for drawer / preview chrome */
export type ArtifactKind =
  | "table"
  | "images"
  | "3d"
  | "custom"
  | "code"
  | "todo"
  | "calendar"
  | "map"
  | "streetview"
  | "website"
  | "repo"
  | "embed"
  | "google-doc"
  | "timeline"
  | "chart"
  | "audio"
  | "stickynote"
  | "quote"
  | "stat"
  | "definition"
  | "claim"
  | "mechanism"
  | "episode"
  | "linkgroup";

export type StickyNoteColorId = "turbo" | "violet" | "haiti" | "chalk";

export interface StickyNoteArtifactData {
  text: string;
  colorId: StickyNoteColorId;
}

/*
 * Transcript artifacts. Authored by the transcript-import builders only — see
 * lib/transcriptArtifacts.ts for normalizers and .claude/skills/transcript-artifacts
 * for the rules that decide when each one is warranted. Every field is a
 * verbatim lift from the source; none of these is reachable from emit_artifact.
 */

/** A line worth keeping, in the speaker's own words. */
export interface QuoteArtifactData {
  text: string;
  speaker: string;
  /** Position in the source, e.g. "01:23:45". */
  timestamp?: string;
  /** One line on what was being discussed, so the quote survives out of context. */
  context?: string;
}

/** A single spoken figure. One or two numbers — three or more is a chart. */
export interface StatArtifactData {
  /** Kept as a string: spoken figures are "about a third" as often as "31". */
  value: string;
  label: string;
  unit?: string;
  /** Both ends or neither — half a comparison is just the value again. */
  delta?: { from: string; to: string };
  source?: string;
  speaker?: string;
}

/** Jargon and the gloss that followed it. */
export interface DefinitionArtifactData {
  term: string;
  gloss: string;
  example?: string;
  speaker?: string;
}

export interface ClaimSide {
  speaker: string;
  text: string;
  timestamp?: string;
}

/**
 * A proposition and the pushback it drew. Deliberately holds no verdict — who
 * won is a judgement, and this artifact only carries what was said.
 */
export interface ClaimArtifactData {
  topic: string;
  proposition: ClaimSide;
  counter: ClaimSide;
}

export interface MechanismStep {
  id: string;
  label: string;
  note?: string;
}

export interface MechanismEdge {
  from: string;
  to: string;
  label?: string;
}

/** A described chain of cause: A leads to B leads to C. */
export interface MechanismArtifactData {
  steps: MechanismStep[];
  edges: MechanismEdge[];
}

/** One entry in an episode's chapter index. */
export interface EpisodeChapterRef {
  label: string;
  /** "13:03" — where the chapter starts in the source. */
  start?: string;
  /**
   * BranchGroup id this chapter maps to on the canvas. Present makes the row
   * clickable; absent leaves it as a readable index entry.
   */
  groupId?: string;
}

/**
 * The masthead for an imported video: what it is, and a clickable index of its
 * chapters. One per canvas — this is the thing you read before the spine.
 */
export interface EpisodeArtifactData {
  videoTitle: string;
  description?: string;
  channel?: string;
  url?: string;
  thumb?: string;
  duration?: string;
  chapters: EpisodeChapterRef[];
}

export interface LinkGroupLink {
  label: string;
  url: string;
  /** Falls back to the domain's favicon when absent. */
  iconUrl?: string;
}

export interface LinkGroupSection {
  label: string;
  links: LinkGroupLink[];
}

/**
 * A directory of links grouped under headings — the shape a video description
 * takes when it carries socials, products and related videos.
 */
export interface LinkGroupArtifactData {
  sections: LinkGroupSection[];
}

export type TodoPriority = "low" | "medium" | "high";

export interface TodoItem {
  id: string;
  label: string;
  checked: boolean;
  dueDate?: string;
  priority?: TodoPriority;
}

export interface TodoArtifactData {
  items: TodoItem[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface CalendarArtifactData {
  viewYear: number;
  viewMonth: number;
  highlightedDates: string[];
  events: CalendarEvent[];
}

export interface TableColumn {
  key: string;
  label: string;
}

export type TableTagTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface TableTag {
  label: string;
  tone?: TableTagTone;
}

export interface TableCell {
  value?: string;
  tags?: TableTag[];
  badge?: string;
}

export type TableRow = Record<string, string | TableCell>;

export interface TableArtifactData {
  columns: TableColumn[];
  rows: TableRow[];
}

export interface CodeFile {
  path: string;
  language: string;
  content: string;
}

export interface CodeArtifactData {
  files: CodeFile[];
}

export interface VideoItem {
  url: string;
  thumb: string;
  title: string;
}

export interface VideoArtifactData {
  items: VideoItem[];
  widescreen?: boolean;
}

export type ImagesMediaItem =
  | { kind: "image"; url: string; thumb?: string; alt?: string }
  | { kind: "youtube"; url: string; thumb?: string; title?: string };

export interface ImagesArtifactData {
  items: ImagesMediaItem[];
}

export interface CustomArtifactData {
  html: string;
  css?: string;
  js?: string;
}

export interface ThreeDArtifactData {
  modelUrl: string;
  format?: "glb" | "gltf";
}

export interface MapPlace {
  name: string;
  label?: string;
  lat?: number;
  lng?: number;
}

export interface MapSavedPlace {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type?: string;
  /**
   * Optional grouping key. Pins sharing a `group` (a batch created together
   * for one reason) are tinted the same colour; otherwise pins are coloured by
   * `type`, falling back to a per-pin colour.
   */
  group?: string;
}

export interface MapArtifactData {
  place: MapPlace;
  zoom: number;
  savedPlaces?: MapSavedPlace[];
  /** Basemap style id (see MAP_STYLES in MapArtifactContent). Omitted = default. */
  mapStyle?: string;
}

/** Frame shape for a Street View artifact: wide rectangle (default) or sphere. */
export type StreetViewMode = "rectangle" | "circle";

export interface StreetViewArtifactData {
  place: MapPlace;
  heading?: number;
  pitch?: number;
  fov?: number;
  viewMode?: StreetViewMode;
}

export interface WebsiteArtifactData {
  url: string;
  title: string;
  domainLabel: string;
  faviconUrl?: string;
  previewImageUrl?: string;
  /**
   * Canvas asset holding the preview image's bytes, once it has been brought
   * into the canvas. Its signed URL expires, so previewImageUrl alone is not
   * enough — this is what lets the card re-mint one from the asset's
   * storagePath instead of dead-ending on a stale link.
   */
  previewAssetId?: string;
  /**
   * Whether the site allows being embedded in a cross-origin iframe. Undefined
   * until the link-preview check resolves; true → render a live interactive
   * iframe; false → render the static preview card.
   */
  embeddable?: boolean;
}

export type EmbedArtifactStatus = "loading" | "ready" | "failed";

export interface EmbedArtifactData {
  url: string;
  provider: string;
  title: string;
  domainLabel: string;
  embedWidth: number;
  embedHeight: number;
  iframeSrc?: string;
  embedHtml?: string;
  status: EmbedArtifactStatus;
  fallback?: {
    domainLabel: string;
    faviconUrl?: string;
    previewImageUrl?: string;
  };
}

export interface RepoArtifactData {
  repoUrl: string;
  owner: string;
  repo: string;
  displayTitle: string;
  explorer: RepoExplorerData;
}

export interface AudioArtifactData {
  fileName: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  durationMs: number;
  peaks: number[];
}

export type GoogleWorkspaceFileKind =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "file";

export type GoogleWorkspaceImportStatus =
  | "loading"
  | "ready"
  | "needs_connect"
  | "needs_access"
  | "failed";

export interface GoogleWorkspaceArtifactData {
  url: string;
  fileId: string;
  fileKind: GoogleWorkspaceFileKind;
  title: string;
  mimeType?: string;
  status: GoogleWorkspaceImportStatus;
  extractedText?: string;
  extractedTextLength?: number;
  truncated?: boolean;
  errorMessage?: string;
}

export type TimelineScale = "year" | "month" | "day";

export interface TimelineEvent {
  id: string;
  /** ISO 8601 — canonical position on the axis */
  at: string;
  /** Short text label — max 10 words (enforced by normalizer) */
  label: string;
  side?: "above" | "below";
  highlight?: boolean;
}

export interface TimelineArtifactData {
  events: TimelineEvent[];
  /** Tick granularity — default "year" */
  scale: TimelineScale;
  rangeStart?: string;
  rangeEnd?: string;
  view?: { scrollLeft: number; zoom: number };
}

export type { ChartArtifactData, ChartType } from "@/lib/chartTypes";

export type ArtifactPayload =
  | { type: "table"; title: string; description?: string; data: TableArtifactData }
  | { type: "code"; title: string; description?: string; data: CodeArtifactData }
  | { type: "video"; title: string; description?: string; data: VideoArtifactData }
  | { type: "images"; title: string; description?: string; data: ImagesArtifactData }
  | { type: "custom"; title: string; description?: string; data: CustomArtifactData }
  | { type: "3d"; title: string; description?: string; data: ThreeDArtifactData }
  | { type: "todo"; title: string; description?: string; data: TodoArtifactData }
  | { type: "calendar"; title: string; description?: string; data: CalendarArtifactData }
  | { type: "map"; title: string; description?: string; data: MapArtifactData }
  | { type: "streetview"; title: string; description?: string; data: StreetViewArtifactData }
  | { type: "website"; title: string; description?: string; data: WebsiteArtifactData }
  | { type: "repo"; title: string; description?: string; data: RepoArtifactData }
  | { type: "embed"; title: string; description?: string; data: EmbedArtifactData }
  | {
      type: "google-doc";
      title: string;
      description?: string;
      data: GoogleWorkspaceArtifactData;
    }
  | { type: "timeline"; title: string; description?: string; data: TimelineArtifactData }
  | { type: "chart"; title: string; description?: string; data: ChartArtifactData }
  | { type: "audio"; title: string; description?: string; data: AudioArtifactData }
  | {
      type: "stickynote";
      title: string;
      description?: string;
      data: StickyNoteArtifactData;
    }
  | { type: "quote"; title: string; description?: string; data: QuoteArtifactData }
  | { type: "stat"; title: string; description?: string; data: StatArtifactData }
  | {
      type: "definition";
      title: string;
      description?: string;
      data: DefinitionArtifactData;
    }
  | { type: "claim"; title: string; description?: string; data: ClaimArtifactData }
  | {
      type: "mechanism";
      title: string;
      description?: string;
      data: MechanismArtifactData;
    }
  | {
      type: "episode";
      title: string;
      description?: string;
      data: EpisodeArtifactData;
    }
  | {
      type: "linkgroup";
      title: string;
      description?: string;
      data: LinkGroupArtifactData;
    };

/** Payload emitted over SSE from emit_artifact tool. */
export interface EmittedArtifact {
  type: Exclude<ResponseType, "text" | "image" | "images">;
  title: string;
  description?: string;
  data: Record<string, unknown>;
}

export function payloadToArtifactKind(payload: ArtifactPayload): ArtifactKind {
  if (payload.type === "video") return "images";
  return payload.type as ArtifactKind;
}

/**
 * A "video" artifact is an images-kind payload whose items are all YouTube
 * embeds (e.g. created by pasting a YouTube URL). Distinguished from an image
 * gallery so the UI can use a video icon and skip version controls.
 */
export function isVideoArtifactPayload(payload: ArtifactPayload): boolean {
  return (
    payload.type === "images" &&
    payload.data.items.length > 0 &&
    payload.data.items.every((item) => item.kind === "youtube")
  );
}

export function imagesPayloadFromCardImages(
  images: { url: string; thumb: string; alt: string }[],
  title: string,
): ArtifactPayload {
  return {
    type: "images",
    title,
    data: {
      items: images.map((img) => ({
        kind: "image" as const,
        url: img.url,
        thumb: img.thumb,
        alt: img.alt,
      })),
    },
  };
}

export function videoPayloadToImages(
  payload: Extract<ArtifactPayload, { type: "video" }>,
): Extract<ArtifactPayload, { type: "images" }> {
  return {
    type: "images",
    title: payload.title,
    description: payload.description,
    data: {
      items: payload.data.items.map((item) => {
        const yt = parseYoutubeId(item.url);
        if (yt) {
          return {
            kind: "youtube" as const,
            url: item.url,
            thumb: item.thumb,
            title: item.title,
          };
        }
        return {
          kind: "image" as const,
          url: item.url,
          thumb: item.thumb,
          alt: item.title,
        };
      }),
    },
  };
}

export function emittedToPayload(artifact: EmittedArtifact): ArtifactPayload {
  const base = {
    title: artifact.title,
    description: artifact.description,
  };
  switch (artifact.type) {
    case "table":
      return {
        type: "table",
        ...base,
        data: normalizeTableArtifactData(artifact.data),
      };
    case "code":
      return {
        type: "code",
        ...base,
        data: artifact.data as unknown as CodeArtifactData,
      };
    case "video":
      return videoPayloadToImages({
        type: "video",
        ...base,
        data: artifact.data as unknown as VideoArtifactData,
      });
    case "custom":
      return {
        type: "custom",
        ...base,
        data:
          normalizeCustomArtifactData(artifact.data) ??
          ({ html: "" } satisfies CustomArtifactData),
      };
    case "3d":
      return {
        type: "3d",
        ...base,
        data: normalizeThreeDArtifactData(
          artifact.data as Record<string, unknown>,
        ),
      };
    case "todo":
      return {
        type: "todo",
        ...base,
        data: normalizeTodoArtifactData(artifact.data),
      };
    case "calendar":
      return {
        type: "calendar",
        ...base,
        data: normalizeCalendarArtifactData(artifact.data),
      };
    case "map":
      return {
        type: "map",
        ...base,
        data: normalizeMapArtifactData(artifact.data),
      };
    case "streetview":
      return {
        type: "streetview",
        ...base,
        data: normalizeStreetViewArtifactData(artifact.data),
      };
    case "timeline":
      return {
        type: "timeline",
        ...base,
        data: normalizeTimelineArtifactData(artifact.data),
      };
    case "chart":
      return {
        type: "chart",
        ...base,
        data: normalizeChartArtifactData(artifact.data),
      };
    default:
      return {
        type: "table",
        ...base,
        data: { columns: [], rows: [] },
      };
  }
}

export function responseTypeFromArtifact(
  type: EmittedArtifact["type"],
): ResponseType {
  if (type === "video") return "images";
  return type;
}
