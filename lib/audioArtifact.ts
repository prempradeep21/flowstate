import type { ArtifactPayload, AudioArtifactData } from "@/lib/artifactTypes";
import { ARTIFACT_CANVAS_CHROME_HEIGHT_PX } from "@/lib/artifactCanvasChrome";
import { ARTIFACT_CONTROLS_BAR_HEIGHT_PX } from "@/lib/artifactFontScale";

/** Matches {@link CANVAS_ARTIFACT_HORIZONTAL_PADDING_PX} — kept local to avoid import cycle. */
const ARTIFACT_HORIZONTAL_PADDING_PX = 32;
const MIN_NODE_WIDTH_PX = 280;

/** Source card id for user-initiated audio drops (no chat turn). */
export const MANUAL_AUDIO_SOURCE_CARD_ID = "__manual_audio__";

export const AUDIO_ASSET_MAX_BYTES = 10 * 1024 * 1024;

/** Canvas waveform width per second of audio — adjacent clips reflect duration ratio. */
export const WAVEFORM_PX_PER_SECOND = 4;

/** Waveform bar area height inside the artifact body. */
export const AUDIO_WAVEFORM_HEIGHT_PX = 72;

/** Body floor: title + waveform + play control + padding — prevents fill-mode collapse. */
export const AUDIO_ARTIFACT_BODY_MIN_HEIGHT = 160;

/** Default node height: chrome + control strip + body floor. */
export const AUDIO_ARTIFACT_HEIGHT =
  ARTIFACT_CANVAS_CHROME_HEIGHT_PX +
  ARTIFACT_CONTROLS_BAR_HEIGHT_PX +
  AUDIO_ARTIFACT_BODY_MIN_HEIGHT;

/** Minimum waveform content width (60s × 4px/s). */
export const MIN_WAVEFORM_CONTENT_WIDTH_PX = 60 * WAVEFORM_PX_PER_SECOND;

/** Audio artifacts can be resized wider than generic canvas artifacts. */
export const MAX_AUDIO_ARTIFACT_WIDTH = 2800;

export const WAVEFORM_PEAK_BINS = 256;

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "application/ogg",
  "audio/webm",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "webm",
]);

function extensionForName(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function isAudioMime(type: string): boolean {
  if (!type) return false;
  if (type.startsWith("video/")) return false;
  return type.startsWith("audio/") || AUDIO_MIME_TYPES.has(type);
}

export function isAudioFile(file: File): boolean {
  const ext = extensionForName(file.name);
  if (AUDIO_EXTENSIONS.has(ext)) {
    if (file.type.startsWith("video/")) return false;
    return true;
  }
  return isAudioMime(file.type);
}

export function audioTitleFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "").trim();
  return stem || fileName || "Audio";
}

export function waveformContentWidthPx(durationMs: number): number {
  const seconds = Math.max(0, durationMs) / 1000;
  return Math.max(MIN_WAVEFORM_CONTENT_WIDTH_PX, seconds * WAVEFORM_PX_PER_SECOND);
}

/** Content-stage width floor for canvas fill layout (duration-proportional). */
export function audioArtifactStageWidthPx(durationMs: number): number {
  return waveformContentWidthPx(durationMs);
}

/** Canvas fill floors — keeps flex children from collapsing to zero. */
export function audioArtifactContentFloors(durationMs: number): {
  minWidth: number;
  minHeight: number;
} {
  return {
    minWidth: audioArtifactStageWidthPx(durationMs),
    minHeight: AUDIO_ARTIFACT_BODY_MIN_HEIGHT,
  };
}

export function audioArtifactWidthForDuration(durationMs: number): number {
  const contentW = waveformContentWidthPx(durationMs);
  const w = contentW + ARTIFACT_HORIZONTAL_PADDING_PX;
  return Math.min(MAX_AUDIO_ARTIFACT_WIDTH, Math.max(MIN_NODE_WIDTH_PX, w));
}

export function getDefaultAudioArtifactSize(payload: {
  data: Pick<AudioArtifactData, "durationMs">;
}): { w: number; h: number } {
  return {
    w: audioArtifactWidthForDuration(payload.data.durationMs),
    h: AUDIO_ARTIFACT_HEIGHT,
  };
}

export function formatAudioDuration(durationMs: number): string {
  const totalSec = Math.max(0, Math.floor(durationMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function normalizeAudioPayload(
  payload: Extract<ArtifactPayload, { type: "audio" }>,
): Extract<ArtifactPayload, { type: "audio" }> {
  const data = payload.data;
  const peaks = Array.isArray(data.peaks)
    ? data.peaks
        .slice(0, WAVEFORM_PEAK_BINS)
        .map((p) => (typeof p === "number" && Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0))
    : Array.from({ length: WAVEFORM_PEAK_BINS }, () => 0);

  while (peaks.length < WAVEFORM_PEAK_BINS) peaks.push(0);

  return {
    ...payload,
    title: payload.title?.trim() || audioTitleFromFileName(data.fileName ?? "Audio"),
    data: {
      fileName: typeof data.fileName === "string" ? data.fileName : "audio",
      mimeType: typeof data.mimeType === "string" ? data.mimeType : "audio/mpeg",
      storagePath: typeof data.storagePath === "string" ? data.storagePath : "",
      publicUrl: typeof data.publicUrl === "string" ? data.publicUrl : "",
      durationMs:
        typeof data.durationMs === "number" && Number.isFinite(data.durationMs)
          ? Math.max(0, Math.round(data.durationMs))
          : 0,
      peaks,
    },
  };
}

export function createAudioPayload(input: {
  fileName: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  durationMs: number;
  peaks: number[];
  title?: string;
}): Extract<ArtifactPayload, { type: "audio" }> {
  return normalizeAudioPayload({
    type: "audio",
    title: input.title ?? audioTitleFromFileName(input.fileName),
    data: {
      fileName: input.fileName,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
      publicUrl: input.publicUrl,
      durationMs: input.durationMs,
      peaks: input.peaks,
    },
  });
}

/** Deterministic peaks for catalog previews and tests. */
export function syntheticWaveformPeaks(seed = 0): number[] {
  return Array.from({ length: WAVEFORM_PEAK_BINS }, (_, i) => {
    const t = (i + seed * 7) / WAVEFORM_PEAK_BINS;
    return 0.15 + 0.85 * Math.abs(Math.sin(t * Math.PI * 6));
  });
}

export function createCatalogAudioPayload(
  title: string,
  durationMs: number,
  seed = 0,
): Extract<ArtifactPayload, { type: "audio" }> {
  return createAudioPayload({
    fileName: `${title.replace(/\s+/g, "-").toLowerCase()}.mp3`,
    mimeType: "audio/mpeg",
    storagePath: "",
    publicUrl: "",
    durationMs,
    peaks: syntheticWaveformPeaks(seed),
    title,
  });
}
