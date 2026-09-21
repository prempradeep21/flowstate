"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CardAskOrchestrator } from "@/components/CardAskOrchestrator";
import { ThemeApplier } from "@/components/ThemeApplier";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import {
  DEFAULT_TRANSCRIPT_IMPORT_CANVAS_ID,
  getTranscriptImportCanvas,
  TRANSCRIPT_IMPORT_CANVASES,
} from "@/lib/buildTranscriptImportPlaygroundSnapshot";
import { useCanvasStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  createCanvasFromSnapshot,
  fetchCanvasList,
} from "@/lib/canvasPersistence";
import { dedupeTitle } from "@/lib/canvasTitles";
import { useTranscriptImportPlaygroundCanvas } from "./useTranscriptImportPlaygroundCanvas";

type PublishState =
  | { status: "idle" }
  | { status: "publishing" }
  | { status: "published"; title: string }
  | { status: "error"; message: string };

export function TranscriptImportPlaygroundApp({
  ideaTitle,
  backHref,
  immersive = false,
}: {
  ideaTitle: string;
  backHref: string;
  immersive?: boolean;
}) {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCanvasId, setActiveCanvasId] = useState(
    DEFAULT_TRANSCRIPT_IMPORT_CANVAS_ID,
  );
  const { fitContent } = useTranscriptImportPlaygroundCanvas(
    canvasContainerRef,
    activeCanvasId,
  );
  const canvasArtifactStyle = useCanvasStore((st) => st.canvasArtifactStyle);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const activeCanvas = getTranscriptImportCanvas(activeCanvasId);
  const [publishState, setPublishState] = useState<PublishState>({
    status: "idle",
  });

  // Switching canvases must not leave the previous canvas's success banner up.
  const selectCanvas = (id: string) => {
    setActiveCanvasId(id);
    setTranscriptOpen(false);
    setPublishState({ status: "idle" });
  };

  const handlePublish = async () => {
    if (publishState.status === "publishing") return;
    setPublishState({ status: "publishing" });
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPublishState({ status: "error", message: "Not signed in." });
        return;
      }
      const existing = await fetchCanvasList(supabase, user.id);
      const title = dedupeTitle(
        activeCanvas.title,
        existing.map((canvas) => canvas.title),
      );
      // Built from the registry, not from the live store. The store holds
      // whatever this session did to the canvas — a nudged card, a stray
      // selection — and the published copy has to be the canonical build.
      const snapshot = activeCanvas.buildSnapshot();
      // Insert only. This page is mid-session with the admin's real canvas
      // stashed in transcriptImportPlaygroundSession, so switching the active
      // canvas underneath it would cross-save two canvases' contents — the
      // same hazard the sample-canvas copy path documents.
      await createCanvasFromSnapshot(supabase, user.id, title, snapshot);
      setPublishState({ status: "published", title });
    } catch (error) {
      setPublishState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to publish canvas.",
      });
    }
  };

  const publishButton = (
    <button
      type="button"
      onClick={handlePublish}
      disabled={publishState.status === "publishing"}
      className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      <AdminActionIcon name="export" className="h-4 w-4 text-canvas-card" />
      {publishState.status === "publishing"
        ? "Publishing…"
        : publishState.status === "published"
          ? "Publish another copy"
          : "Publish to canvas"}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas-bg">
      {!immersive ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-canvas-border px-4 py-2 sm:px-6">
          <div className="min-w-0">
            <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Playground · temporary
            </p>
            <h2 className="truncate font-display text-lg font-medium text-canvas-ink">
              {ideaTitle}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={fitContent}
              className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              <AdminActionIcon name="fit-canvas" />
              Fit canvas
            </button>
            {publishButton}
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
            >
              <AdminActionIcon name="back" />
              Back to idea
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-canvas-border px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={fitContent}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
          >
            <AdminActionIcon name="fit-canvas" />
            Fit canvas
          </button>
          {publishButton}
        </div>
      )}

      {publishState.status === "published" ||
      publishState.status === "error" ? (
        <div
          role="status"
          className={`flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2 text-canvas-body-sm sm:px-6 ${
            publishState.status === "error"
              ? "border-canvas-border bg-canvas-card text-canvas-ink"
              : "border-canvas-accent/30 bg-canvas-accent/5 text-canvas-ink"
          }`}
        >
          {publishState.status === "error" ? (
            <>
              <AdminActionIcon name="alert" className="h-4 w-4" />
              <span>{publishState.message}</span>
            </>
          ) : (
            <>
              <AdminActionIcon name="sparkles" className="h-4 w-4" />
              <span>
                Published as{" "}
                <span className="font-medium">{publishState.title}</span> on
                your account.
              </span>
              {/* A link, not a canvas switch: this page has the admin's real
                  canvas stashed, and it is restored on the way out. */}
              <Link
                href="/"
                className="inline-flex items-center gap-1 font-medium text-canvas-accent hover:underline"
              >
                Open it in the app
                <AdminActionIcon name="chevron-right" className="h-3.5 w-3.5" />
              </Link>
              <span className="text-canvas-micro text-canvas-muted">
                Share it with the podcaster from the canvas&apos;s Share →
                Publish to web.
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* Each transcript is its own canvas — the chips switch between them,
          and the transcript text itself lives behind one disclosure. */}
      <section
        className="relative z-10 shrink-0 border-b border-canvas-border bg-canvas-bg/80 px-3 py-1.5 sm:px-4"
        aria-label="Imported canvases"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            <AdminActionIcon name="transcript" className="h-3.5 w-3.5" />
            Canvases
          </span>
          {TRANSCRIPT_IMPORT_CANVASES.map((canvas) => {
            const active = canvas.id === activeCanvasId;
            return (
              <button
                key={canvas.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectCanvas(canvas.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-canvas-micro font-medium transition-colors ${
                  active
                    ? "border-canvas-accent bg-canvas-accent/10 text-canvas-accent"
                    : "border-canvas-border/80 bg-canvas-card/60 text-canvas-muted hover:bg-canvas-card hover:text-canvas-ink"
                }`}
              >
                {canvas.title}
              </button>
            );
          })}

          <button
            type="button"
            aria-expanded={transcriptOpen}
            onClick={() => setTranscriptOpen((prev) => !prev)}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-canvas-border/80 bg-canvas-card/60 px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-muted transition-colors hover:bg-canvas-card hover:text-canvas-ink"
          >
            Transcript
            <AdminActionIcon
              name={transcriptOpen ? "chevron-up" : "chevron-down"}
              className="h-3 w-3"
            />
          </button>
        </div>

        {transcriptOpen ? (
          <div className="absolute inset-x-3 top-full z-20 mt-1 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2.5 shadow-card sm:inset-x-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-canvas-body-sm font-medium text-canvas-ink">
                {activeCanvas.title}
              </p>
              <div className="flex items-center gap-2">
                {activeCanvas.sourceUrl ? (
                  <a
                    href={activeCanvas.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-canvas-micro text-canvas-accent hover:underline"
                  >
                    <AdminActionIcon name="link" className="h-3 w-3" />
                    Source
                  </a>
                ) : null}
                <span className="text-canvas-micro text-canvas-muted">
                  Pasted text · demo
                </span>
                <button
                  type="button"
                  onClick={() => setTranscriptOpen(false)}
                  className="text-canvas-micro text-canvas-muted hover:text-canvas-ink"
                  aria-label="Close transcript"
                >
                  <AdminActionIcon name="chevron-up" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="max-h-[26vh] overflow-y-auto whitespace-pre-wrap text-canvas-body-sm leading-relaxed text-canvas-muted">
              {activeCanvas.transcript}
            </p>
          </div>
        ) : null}
      </section>

      {/*
        The pack has to be scoped here as well as named on the snapshot.
        canvasArtifactStyle only records which pack is active; nothing renders
        the [data-artifact-style] hook that app/styles/artifact-styles.css keys
        off unless a subtree opts in, which app/page.tsx does around the
        workspace and this page previously did not. Read from the store rather
        than the snapshot so the toolbar's style switcher still works here.
      */}
      <ArtifactStyleScope styleId={canvasArtifactStyle}>
        <div className="relative min-h-0 flex-1 bg-canvas-bg">
          <ThemeApplier />
          <div
            ref={canvasContainerRef}
            className="absolute inset-0"
            data-transcript-import-playground
          >
            <Canvas containerRef={canvasContainerRef} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
            <CanvasBottomToolbar />
          </div>
          <CardAskOrchestrator />
        </div>
      </ArtifactStyleScope>
    </div>
  );
}
