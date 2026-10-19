import { parsePartialJson } from "@/lib/llm/partialJson";
import type { EmitFn } from "@/lib/llm/provider";

/**
 * Streams the half-written input of an emit_artifact tool call to the client
 * as `artifactDraft` events, so the canvas can pop a skeleton the moment the
 * type is known and fill it in while the model is still writing.
 *
 * Drafts are a preview only — the authoritative `artifact` event still comes
 * from the tool executor once the full input is validated and normalized.
 */

const EMIT_ARTIFACT = "emit_artifact";
const DRAFT_INTERVAL_MS = 150;

const DRAFT_TYPES = new Set([
  "table",
  "code",
  "video",
  "custom",
  "3d",
  "map",
  "streetview",
  "todo",
  "calendar",
  "timeline",
  "chart",
]);

/**
 * Kinds whose partial data renders safely. The rest (maps need server
 * geocoding, custom UI would run half a script) stream as a titled skeleton.
 */
const DATA_DRAFT_TYPES = new Set([
  "table",
  "code",
  "todo",
  "calendar",
  "timeline",
  "chart",
]);

export interface ArtifactDraftEvent {
  id: string;
  type: string;
  title?: string;
  description?: string;
  data?: Record<string, unknown>;
}

interface DraftState {
  id: string;
  args: string;
  lastSentAt: number;
  lastSentLength: number;
  typeSent: boolean;
}

export function createArtifactDraftStreamer(emit: EmitFn) {
  const drafts = new Map<string, DraftState>();

  const send = (draft: DraftState, force: boolean) => {
    const now = Date.now();
    if (!force && draft.typeSent && now - draft.lastSentAt < DRAFT_INTERVAL_MS) {
      return;
    }
    if (draft.args.length === draft.lastSentLength) return;

    const parsed = parsePartialJson(draft.args);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    const input = parsed as Record<string, unknown>;
    const type = typeof input.type === "string" ? input.type : "";
    if (!DRAFT_TYPES.has(type)) return;

    const event: ArtifactDraftEvent = { id: draft.id, type };
    if (typeof input.title === "string" && input.title.trim()) {
      event.title = input.title;
    }
    if (typeof input.description === "string") {
      event.description = input.description;
    }
    if (
      DATA_DRAFT_TYPES.has(type) &&
      input.data &&
      typeof input.data === "object" &&
      !Array.isArray(input.data)
    ) {
      event.data = input.data as Record<string, unknown>;
    }

    draft.typeSent = true;
    draft.lastSentAt = now;
    draft.lastSentLength = draft.args.length;
    emit({ artifactDraft: event });
  };

  return {
    /** A tool call began. Only emit_artifact calls are tracked. */
    start(id: string, toolName: string) {
      if (toolName !== EMIT_ARTIFACT || !id) return;
      drafts.set(id, {
        id,
        args: "",
        lastSentAt: 0,
        lastSentLength: 0,
        typeSent: false,
      });
    },
    /** More of the tool call's JSON input arrived. */
    append(id: string, chunk: string) {
      const draft = drafts.get(id);
      if (!draft || !chunk) return;
      draft.args += chunk;
      send(draft, false);
    },
    /** The tool call's input is complete — flush the last partial state. */
    end(id: string) {
      const draft = drafts.get(id);
      if (!draft) return;
      send(draft, true);
      drafts.delete(id);
    },
    endAll() {
      for (const id of [...drafts.keys()]) this.end(id);
    },
  };
}
