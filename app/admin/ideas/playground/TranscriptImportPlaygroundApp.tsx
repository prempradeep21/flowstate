"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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
import {
  HUBERMAN_NEUROPLASTICITY_TRANSCRIPT,
  HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
} from "@/lib/transcriptImport/hubermanNeuroplasticity";
import { useTranscriptImportPlaygroundCanvas } from "./useTranscriptImportPlaygroundCanvas";

interface TranscriptSource {
  id: string;
  title: string;
  text: string;
  sourceUrl?: string;
}

const TRANSCRIPTS: TranscriptSource[] = [
  {
    id: "design-tools",
    title: "Design tools history",
    text: DESIGN_TOOLS_HISTORY_TRANSCRIPT,
  },
  {
    id: "yc-interview",
    title: "YC interview tips",
    text: YC_INTERVIEW_TIPS_TRANSCRIPT,
    sourceUrl: YC_INTERVIEW_TIPS_VIDEO_URL,
  },
  {
    id: "huberman-neuroplasticity",
    title: "Neuroplasticity — Huberman",
    text: HUBERMAN_NEUROPLASTICITY_TRANSCRIPT,
    sourceUrl: HUBERMAN_NEUROPLASTICITY_SOURCE_URL,
  },
];

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
  const [openTranscriptId, setOpenTranscriptId] = useState<string | null>(null);

  const openTranscript =
    TRANSCRIPTS.find((t) => t.id === openTranscriptId) ?? null;

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

      {/* Minimal transcript bar: collapsed chips that reveal a transcript only
          when clicked, leaving the wide canvas below room to breathe. */}
      <section
        className="relative z-10 shrink-0 border-b border-canvas-border bg-canvas-bg/80 px-3 py-1.5 sm:px-4"
        aria-label="Source transcripts"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
            <AdminActionIcon name="transcript" className="h-3.5 w-3.5" />
            Transcripts
          </span>
          {TRANSCRIPTS.map((t) => {
            const active = t.id === openTranscriptId;
            return (
              <button
                key={t.id}
                type="button"
                aria-expanded={active}
                onClick={() =>
                  setOpenTranscriptId((prev) => (prev === t.id ? null : t.id))
                }
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-canvas-micro font-medium transition-colors ${
                  active
                    ? "border-canvas-accent bg-canvas-accent/10 text-canvas-accent"
                    : "border-canvas-border/80 bg-canvas-card/60 text-canvas-muted hover:bg-canvas-card hover:text-canvas-ink"
                }`}
              >
                {t.title}
                <AdminActionIcon
                  name={active ? "chevron-up" : "chevron-down"}
                  className="h-3 w-3"
                />
              </button>
            );
          })}
        </div>

        {openTranscript ? (
          <div className="absolute inset-x-3 top-full z-20 mt-1 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2.5 shadow-card sm:inset-x-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-canvas-body-sm font-medium text-canvas-ink">
                {openTranscript.title}
              </p>
              <div className="flex items-center gap-2">
                {openTranscript.sourceUrl ? (
                  <a
                    href={openTranscript.sourceUrl}
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
                  onClick={() => setOpenTranscriptId(null)}
                  className="text-canvas-micro text-canvas-muted hover:text-canvas-ink"
                  aria-label="Close transcript"
                >
                  <AdminActionIcon name="chevron-up" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="max-h-[26vh] overflow-y-auto whitespace-pre-wrap text-canvas-body-sm leading-relaxed text-canvas-muted">
              {openTranscript.text}
            </p>
          </div>
        ) : null}
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
  );
}
