"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usePersistenceReady } from "@/components/AuthProvider";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
import { ThemeApplier } from "@/components/ThemeApplier";
import { buildCanvasSnapshot, parseCanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  markViewportRestoredFromSnapshot,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import {
  beginPublishedCanvasSession,
  endPublishedCanvasSession,
  isPublishedCanvasAdopted,
} from "@/lib/publishedCanvasSession";
import { useCanvasStore } from "@/lib/store";

interface PublishedCanvasAppProps {
  slug: string;
  publishedCanvasId: string;
  version: number;
  title: string;
  ownerName: string | null;
}

/**
 * Renders a published canvas on the REAL canvas, for anyone, signed in or not.
 *
 * The visitor is fully editable from the first pixel — exactly like today's
 * guest canvas — because the fork is bookkeeping, not a data operation: the
 * store already holds their copy and they have no write path to the original.
 * Read-only would be theatre, and it would disable the very ask button whose
 * click is supposed to start the fork.
 *
 * Everything here runs inside a published session, which stashes a signed-in
 * visitor's own canvas and mutes autosave. Without it, hydrating this snapshot
 * would silently overwrite their canvas.
 */
export function PublishedCanvasApp({
  slug,
  publishedCanvasId,
  version,
  title,
  ownerName,
}: PublishedCanvasAppProps) {
  const router = useRouter();
  const persistenceReady = usePersistenceReady();
  const { user, adoptPublishedCanvasFork } = useAuth();
  const forked = useCanvasStore((s) => s.publishedOrigin?.forked ?? false);
  const hydrateFromSnapshot = useCanvasStore((s) => s.hydrateFromSnapshot);
  const setPublishedOrigin = useCanvasStore((s) => s.setPublishedOrigin);
  const sessionStartedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!persistenceReady || sessionStartedRef.current) return;

    // Stash the visitor's real canvas and mute autosave BEFORE touching the
    // store — the order matters, not just the fact of doing it.
    beginPublishedCanvasSession(
      useCanvasStore.getState().getCanvasSnapshotSource(),
    );
    sessionStartedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/published/${slug}/${version}`);
        if (!res.ok) throw new Error("This canvas is no longer available.");
        const raw = (await res.json()) as unknown;
        if (cancelled) return;

        const snapshot = parseCanvasSnapshot(raw);
        if (!snapshot) throw new Error("This canvas could not be read.");

        resetViewportBootstrap();
        hydrateFromSnapshot(snapshot, {
          applyViewport: true,
          canvasReveal: true,
        });
        markViewportRestoredFromSnapshot();
        setPublishedOrigin({
          slug,
          publishedCanvasId,
          version,
          title,
          ownerName,
          forked: false,
          forkSaveState: "idle",
        });
        setLoaded(true);

        // Fire-and-forget view beacon. Deduped per visitor per day server-side.
        void fetch("/api/published/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishedCanvasId }),
        }).catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    persistenceReady,
    slug,
    version,
    publishedCanvasId,
    title,
    ownerName,
    hydrateFromSnapshot,
    setPublishedOrigin,
  ]);

  /**
   * A signed-in visitor's fork has to be written the moment it happens.
   *
   * A guest's fork survives on its own — it is stashed at sign-in and adopted
   * on return — but nothing carries a signed-in visitor's copy anywhere: the
   * published session mutes autosave, and the unmount below would hand their
   * old canvas back over the top of it. Adoption is what makes the "Saved to
   * your canvases" toast true.
   */
  useEffect(() => {
    if (!loaded || !forked || !user) return;
    void adoptPublishedCanvasFork();
  }, [adoptPublishedCanvasFork, forked, loaded, user]);

  // Restore the visitor's own canvas on the way out — unless the fork became
  // a canvas of their own, in which case the restore would undo the adoption.
  useEffect(() => {
    return () => {
      if (!sessionStartedRef.current) return;
      const adopted = isPublishedCanvasAdopted();
      const restore = endPublishedCanvasSession();
      sessionStartedRef.current = false;
      useCanvasStore.getState().setPublishedOrigin(null);
      if (restore && !adopted) {
        resetViewportBootstrap();
        useCanvasStore
          .getState()
          .hydrateFromSnapshot(buildCanvasSnapshot(restore), {
            applyViewport: true,
            canvasReveal: false,
          });
      }
    };
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <p className="rounded-canvas border border-canvas-border bg-canvas-card px-6 py-4 text-canvas-muted">
            {error}
          </p>
        </div>
      )}
      {/* No Home grid on this surface — the visitor may not have an account.
          The logo goes to Flowstate itself. The published header — whose
          canvas this is, and what asking a question does — is folded into the
          canvas chip in AppLeftPanel rather than floating as a second card
          that repeats the title. */}
      <CanvasWorkspace onGoHome={() => router.push("/")} />
    </main>
  );
}
