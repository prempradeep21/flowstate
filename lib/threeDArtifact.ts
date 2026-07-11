import type { ArtifactPayload, ThreeDArtifactData } from "@/lib/artifactTypes";

export const MANUAL_3D_SOURCE_CARD_ID = "__manual_3d__";

/** Public sample model used for manual placement and catalog previews. */
export const DEFAULT_3D_SAMPLE_URL =
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export const THREE_D_MODEL_MAX_BYTES = 10 * 1024 * 1024;

export function extensionForFileName(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function threeDFormatFromFile(file: File): "glb" | "gltf" | null {
  const ext = extensionForFileName(file.name);
  if (ext === "glb") return "glb";
  if (ext === "gltf") return "gltf";
  if (file.type === "model/gltf-binary") return "glb";
  if (file.type === "model/gltf+json") return "gltf";
  return null;
}

export function isThreeDModelFile(file: File): boolean {
  return threeDFormatFromFile(file) !== null;
}

export function normalizeThreeDArtifactData(
  raw: Record<string, unknown> | ThreeDArtifactData,
): ThreeDArtifactData {
  const modelUrl =
    typeof raw.modelUrl === "string" && raw.modelUrl.trim()
      ? raw.modelUrl.trim()
      : DEFAULT_3D_SAMPLE_URL;
  const formatRaw = raw.format;
  const format =
    formatRaw === "gltf" || formatRaw === "glb"
      ? formatRaw
      : extensionForFileName(modelUrl) === "gltf"
        ? "gltf"
        : "glb";
  return { modelUrl, format };
}

export function createThreeDPayload(opts: {
  fileName: string;
  modelUrl: string;
  format: "glb" | "gltf";
  title?: string;
}): Extract<ArtifactPayload, { type: "3d" }> {
  const baseName = opts.fileName.replace(/\.[^.]+$/, "").trim();
  const title = opts.title?.trim() || baseName || "3D model";
  return {
    type: "3d",
    title,
    data: {
      modelUrl: opts.modelUrl,
      format: opts.format,
    },
  };
}
