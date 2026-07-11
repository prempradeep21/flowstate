import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { parseCanvasSnapshot } from "@/lib/canvasSnapshot";

const STORAGE_KEY = "flowstate:mobile-sdlc-sandbox:v1";

export function readMobileSdlcSandboxSnapshot(): CanvasSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { snapshot?: unknown };
    return parseCanvasSnapshot(parsed.snapshot);
  } catch {
    return null;
  }
}

export function writeMobileSdlcSandboxSnapshot(snapshot: CanvasSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ writtenAt: Date.now(), snapshot }),
    );
  } catch {
    // Quota or private mode — sandbox edits may not persist.
  }
}

export function clearMobileSdlcSandboxSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { STORAGE_KEY as MOBILE_SDLC_SANDBOX_STORAGE_KEY };
