import { normalizeCustomArtifactData } from "@/lib/customArtifact";
import { normalizeMapArtifactData } from "@/lib/mapArtifact";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
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
  | "map"
  | "website";

/** UI routing for drawer / preview chrome */
export type ArtifactKind =
  | "table"
  | "images"
  | "3d"
  | "custom"
  | "code"
  | "todo"
  | "map"
  | "website";

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
}

export interface MapArtifactData {
  place: MapPlace;
  zoom: number;
  savedPlaces?: MapSavedPlace[];
}

export interface WebsiteArtifactData {
  url: string;
  title: string;
  domainLabel: string;
  faviconUrl?: string;
  previewImageUrl?: string;
}

export type ArtifactPayload =
  | { type: "table"; title: string; description?: string; data: TableArtifactData }
  | { type: "code"; title: string; description?: string; data: CodeArtifactData }
  | { type: "video"; title: string; description?: string; data: VideoArtifactData }
  | { type: "images"; title: string; description?: string; data: ImagesArtifactData }
  | { type: "custom"; title: string; description?: string; data: CustomArtifactData }
  | { type: "3d"; title: string; description?: string; data: ThreeDArtifactData }
  | { type: "todo"; title: string; description?: string; data: TodoArtifactData }
  | { type: "map"; title: string; description?: string; data: MapArtifactData }
  | { type: "website"; title: string; description?: string; data: WebsiteArtifactData };

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
        data: artifact.data as unknown as ThreeDArtifactData,
      };
    case "todo":
      return {
        type: "todo",
        ...base,
        data: normalizeTodoArtifactData(artifact.data),
      };
    case "map":
      return {
        type: "map",
        ...base,
        data: normalizeMapArtifactData(artifact.data),
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
