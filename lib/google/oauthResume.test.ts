import { describe, expect, it, beforeEach, vi } from "vitest";



const storage = new Map<string, string>();

vi.stubGlobal("sessionStorage", {

  getItem: (key: string) => storage.get(key) ?? null,

  setItem: (key: string, value: string) => {

    storage.set(key, value);

  },

  removeItem: (key: string) => {

    storage.delete(key);

  },

  clear: () => storage.clear(),

  key: () => null,

  length: 0,

});



import {

  clearOAuthResumeCheckpoint,

  OAUTH_RESUME_STORAGE_KEY,

  readOAuthResumeCheckpoint,

  saveOAuthResumeCheckpoint,

} from "@/lib/google/oauthResume";

import { useCanvasStore } from "@/lib/store";



describe("oauthResume checkpoint", () => {

  beforeEach(() => {

    storage.clear();

    useCanvasStore.getState().resetCanvasState();

  });



  it("saves and reads a canvas checkpoint before OAuth", () => {

    useCanvasStore.getState().createRootCard({ x: 0, y: 0 });

    saveOAuthResumeCheckpoint({ intent: "picker", artifactId: "art-1" });



    const resume = readOAuthResumeCheckpoint();

    expect(resume?.intent).toBe("picker");

    expect(resume?.artifactId).toBe("art-1");

    expect(resume?.checkpoint.cardOrder.length).toBeGreaterThan(0);

  });



  it("clears stale checkpoints", () => {

    storage.set(

      OAUTH_RESUME_STORAGE_KEY,

      JSON.stringify({

        intent: "picker",

        savedAt: Date.now() - 60 * 60 * 1000,

        checkpoint: { version: 1, cardOrder: [] },

      }),

    );

    expect(readOAuthResumeCheckpoint()).toBeNull();

  });



  it("clearOAuthResumeCheckpoint removes storage", () => {

    saveOAuthResumeCheckpoint({ intent: "none" });

    clearOAuthResumeCheckpoint();

    expect(storage.get(OAUTH_RESUME_STORAGE_KEY)).toBeUndefined();

  });

});


