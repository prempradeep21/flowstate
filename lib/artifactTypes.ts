import { normalizeCustomArtifactData } from "@/lib/customArtifact";

/** Response shape for a single canvas card turn. */

export type ResponseType =
  | "text"
  | "image"
  | "video"
  | "table"
  | "code"
  | "custom"
  | "3d";

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableCell {
  value: string;
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

export interface CustomArtifactData {
  html: string;
  css?: string;
  js?: string;
}

export interface ThreeDArtifactData {
  modelUrl: string;
  format?: "glb" | "gltf";
}

export type ArtifactPayload =
  | { type: "table"; title: string; description?: string; data: TableArtifactData }
  | { type: "code"; title: string; description?: string; data: CodeArtifactData }
  | { type: "video"; title: string; description?: string; data: VideoArtifactData }
  | { type: "custom"; title: string; description?: string; data: CustomArtifactData }
  | { type: "3d"; title: string; description?: string; data: ThreeDArtifactData };

/** Payload emitted over SSE from emit_artifact tool. */
export interface EmittedArtifact {
  type: Exclude<ResponseType, "text" | "image">;
  title: string;
  description?: string;
  data: Record<string, unknown>;
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
        data: artifact.data as unknown as TableArtifactData,
      };
    case "code":
      return {
        type: "code",
        ...base,
        data: artifact.data as unknown as CodeArtifactData,
      };
    case "video":
      return {
        type: "video",
        ...base,
        data: artifact.data as unknown as VideoArtifactData,
      };
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
  return type;
}
