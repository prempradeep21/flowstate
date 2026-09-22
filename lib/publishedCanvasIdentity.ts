import { buildDuplicateTitle } from "@/lib/collaborationPersistence";

/** The parts of `publishedOrigin` that decide what the canvas chip says. */
export interface PublishedOriginSummary {
  title: string;
  ownerName: string | null;
  forked: boolean;
  forkSaveState: "idle" | "saving" | "saved" | "failed";
}

export interface PublishedCanvasIdentityInput {
  /** Null anywhere but `/c/<slug>`. */
  origin: PublishedOriginSummary | null;
  signedIn: boolean;
  supabaseConfigured: boolean;
  /** localhost reads production but never writes to it. */
  localReadOnly: boolean;
}

export interface PublishedCanvasIdentity {
  /** Name of the canvas actually on screen. */
  title: string;
  /** Second line, or null when there is nothing worth saying. */
  subtitle: string | null;
  /** Recovery affordance, only for the states where the copy is not safe. */
  action: { kind: "sign-in" | "retry"; label: string } | null;
}

/**
 * What the canvas chip says while someone is on a published link.
 *
 * Returns null everywhere else, so the chip falls back to the visitor's own
 * canvas title. On a published link that fallback is a lie — the visitor's
 * canvas is stashed, not open — which is the whole reason this exists.
 *
 * Before the fork it carries the published header: whose canvas this is, and
 * what asking a question will do. After the fork it is the visitor's own
 * canvas and reads like one — title only. The exceptions are the states where
 * the copy is NOT safe; the success case is a toast fired once at the moment
 * of adoption, not a standing label that has to be re-read every time.
 */
export function resolvePublishedCanvasIdentity({
  origin,
  signedIn,
  supabaseConfigured,
  localReadOnly,
}: PublishedCanvasIdentityInput): PublishedCanvasIdentity | null {
  if (!origin) return null;

  if (!origin.forked) {
    return {
      title: origin.title,
      subtitle: origin.ownerName
        ? `Published by ${origin.ownerName} · ask anything to start your own copy`
        : "Ask anything to start your own copy",
      action: null,
    };
  }

  const title = buildDuplicateTitle(origin.title);

  // A guest's copy lives only in this tab until they sign in — the one moment
  // where losing it is still avoidable.
  if (!signedIn) {
    return {
      title,
      subtitle: "Sign in to keep it — the original is untouched.",
      action: supabaseConfigured
        ? { kind: "sign-in", label: "Sign in to keep" }
        : null,
    };
  }

  // No copy to promise here, so say that rather than let silence imply a save.
  if (localReadOnly) {
    return {
      title,
      subtitle: "Local session — this copy isn't saved.",
      action: null,
    };
  }

  if (origin.forkSaveState === "failed") {
    return {
      title,
      subtitle: "Couldn't save this copy to your canvases.",
      action: { kind: "retry", label: "Try again" },
    };
  }

  return { title, subtitle: null, action: null };
}
