import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";

import type { CanvasSnapshot } from "@/lib/canvasSnapshot";

import type { GoogleOAuthIntent } from "@/lib/google/oauthReturn";

import { useCanvasStore } from "@/lib/store";



export const OAUTH_RESUME_STORAGE_KEY = "flowstate:google_oauth_resume";

const CHECKPOINT_MAX_AGE_MS = 15 * 60 * 1000;



export interface OAuthResumeCheckpoint {

  intent: GoogleOAuthIntent;

  artifactId?: string;

  checkpoint: CanvasSnapshot;

  savedAt: number;

}



export function saveOAuthResumeCheckpoint(opts?: {

  intent?: GoogleOAuthIntent;

  artifactId?: string;

}): void {

  if (typeof sessionStorage === "undefined") return;

  try {

    const state = useCanvasStore.getState();

    const payload: OAuthResumeCheckpoint = {

      intent: opts?.intent === "picker" ? "picker" : "none",

      artifactId: opts?.artifactId?.trim() || undefined,

      checkpoint: buildCanvasSnapshot(state.getCanvasSnapshotSource()),

      savedAt: Date.now(),

    };

    sessionStorage.setItem(OAUTH_RESUME_STORAGE_KEY, JSON.stringify(payload));

  } catch (err) {

    console.warn("[google-oauth] could not save resume checkpoint", err);

  }

}



export function readOAuthResumeCheckpoint(): OAuthResumeCheckpoint | null {

  if (typeof sessionStorage === "undefined") return null;

  try {

    const raw = sessionStorage.getItem(OAUTH_RESUME_STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw) as Partial<OAuthResumeCheckpoint>;

    if (!data.checkpoint || typeof data.savedAt !== "number") return null;

    if (Date.now() - data.savedAt > CHECKPOINT_MAX_AGE_MS) {

      clearOAuthResumeCheckpoint();

      return null;

    }

    return {

      intent: data.intent === "picker" ? "picker" : "none",

      artifactId:

        typeof data.artifactId === "string" && data.artifactId.trim()

          ? data.artifactId.trim()

          : undefined,

      checkpoint: data.checkpoint,

      savedAt: data.savedAt,

    };

  } catch {

    return null;

  }

}



export function clearOAuthResumeCheckpoint(): void {

  if (typeof sessionStorage === "undefined") return;

  sessionStorage.removeItem(OAUTH_RESUME_STORAGE_KEY);

}



/** Ask persistence to flush the canvas before leaving for Google OAuth. */

export function requestOAuthFlush(): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {

    let settled = false;

    const finish = () => {

      if (settled) return;

      settled = true;

      window.clearTimeout(timer);

      resolve();

    };

    const timer = window.setTimeout(finish, 4_000);

    window.dispatchEvent(

      new CustomEvent("flowstate:oauth-flush", { detail: { finish } }),

    );

  });

}


