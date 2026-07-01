"use client";

import Link from "next/link";
import { useRef } from "react";
import { Canvas } from "@/components/Canvas";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CardAskOrchestrator } from "@/components/CardAskOrchestrator";
import { ThemeApplier } from "@/components/ThemeApplier";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import { DESIGN_TOOLS_HISTORY_TRANSCRIPT } from "@/lib/transcriptImport/designToolsHistory";
import {
  YC_INTERVIEW_TIPS_TRANSCRIPT,
  YC_INTERVIEW_TIPS_VIDEO_URL,
} from "@/lib/transcriptImport/ycInterviewTips";
import { useTranscriptImportPlaygroundCanvas } from "./useTranscriptImportPlaygroundCanvas";

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
  const { fitContent } = useTranscriptImportPlaygroundCanvas(canvasContainerRef);

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
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
          <section
            className="shrink-0 border-b border-canvas-border bg-canvas-bg/80 px-4 py-3 sm:px-5"
            aria-label="Source transcripts"
          >
            <h3 className="mb-3 flex items-center gap-1.5 text-canvas-body-sm font-semibold text-canvas-ink">
              <AdminActionIcon name="transcript" />
              Transcripts
            </h3>
            <div className="flex max-h-[28vh] flex-col gap-3 overflow-y-auto">
              <div className="rounded-canvas border border-canvas-border/80 bg-canvas-card/60 px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-canvas-body-sm font-medium text-canvas-ink">
                    Design tools history
                  </p>
                  <span className="text-canvas-micro text-canvas-muted">
                    Pasted text · demo
                  </span>
                </div>
                <p className="max-h-[10vh] overflow-y-auto whitespace-pre-wrap text-canvas-body-sm leading-relaxed text-canvas-muted">
                  {DESIGN_TOOLS_HISTORY_TRANSCRIPT}
                </p>
              </div>
              <div className="rounded-canvas border border-canvas-border/80 bg-canvas-card/60 px-3 py-2.5">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-canvas-body-sm font-medium text-canvas-ink">
                    YC interview tips
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href={YC_INTERVIEW_TIPS_VIDEO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-canvas-micro text-canvas-accent hover:underline"
                    >
                      <AdminActionIcon name="link" className="h-3 w-3" />
                      Source video
                    </a>
                    <span className="text-canvas-micro text-canvas-muted">
                      Pasted text · demo
                    </span>
                  </div>
                </div>
                <p className="max-h-[10vh] overflow-y-auto whitespace-pre-wrap text-canvas-body-sm leading-relaxed text-canvas-muted">
                  {YC_INTERVIEW_TIPS_TRANSCRIPT}
                </p>
              </div>
            </div>
          </section>

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
        </div>
      </div>
    </div>
  );
}
