"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { MotionPanelLine } from "@/components/motion/MotionPanelLine";
import { CreditMeter } from "@/components/billing/CreditMeter";
import { PanelChevronIcon } from "@/components/PanelChrome";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { MotionPanelContent } from "@/components/motion/MotionPanel";
import { ArtifactUpdateCenter } from "@/components/ArtifactUpdateCenter";
import { CanvasSearch } from "@/components/canvas/CanvasSearch";
import { CanvasesSection } from "@/components/sidebar/CanvasesSection";
import { usePublishedCanvasIdentity } from "@/components/published/usePublishedCanvasIdentity";
import {
  LEFT_PANEL_SECTIONS,
  PANEL_LINE_STAGGER_MS,
} from "@/lib/motion/variants";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel({ onGoHome }: { onGoHome?: () => void }) {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);
  const { activeCanvasId, canvases } = useAuth();
  // On a published link the visitor's own canvas is stashed, not open, so the
  // canvas list would name the wrong canvas here. `published` takes over the
  // chip for that surface and folds in what used to be a second floating
  // header: publisher, and what asking a question does.
  const published = usePublishedCanvasIdentity();
  const canvasTitle =
    published?.title ??
    canvases.find((c) => c.id === activeCanvasId)?.title ??
    "Canvas";
  const [lineStaggerActive, setLineStaggerActive] = useState(false);
  const [staggerKey, setStaggerKey] = useState(0);
  const prevCollapsedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (prevCollapsedRef.current === true && collapsed === false) {
      setStaggerKey((k) => k + 1);
      setLineStaggerActive(true);
    }
    prevCollapsedRef.current = collapsed;
  }, [collapsed]);

  useEffect(() => {
    if (!lineStaggerActive) return;
    const timer = window.setTimeout(
      () => setLineStaggerActive(false),
      PANEL_LINE_STAGGER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [lineStaggerActive, staggerKey]);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-40 flex flex-col items-start gap-5">
      <div className="flex items-start gap-2">
        <aside
          className={[
            "pointer-events-auto flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card transition-[width,height] duration-panel ease-panel",
            collapsed ? "w-auto" : "w-[315px]",
            // The published sub-line is a sentence, not a label — give the
            // collapsed chip room for it rather than truncating it to nothing.
            collapsed && published?.subtitle
              ? "max-w-[min(30rem,72vw)]"
              : "max-w-[min(20rem,40vw)]",
          ].join(" ")}
          style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}
        >
          <MotionPanelContent
            side="left"
            collapsed={collapsed}
            collapsedContent={
              <div
                data-coach-target="left-sidebar-entry"
                className="flex min-w-0 items-center gap-2"
              >
                <FlowstateBrand compact onLogoClick={onGoHome} />
                <div
                  className={[
                    "min-w-0",
                    published?.subtitle
                      ? "max-w-[min(22rem,52vw)]"
                      : "max-w-[min(12rem,28vw)]",
                  ].join(" ")}
                >
                  <span
                    className="block truncate text-canvas-body-sm font-medium text-canvas-ink"
                    title={canvasTitle}
                  >
                    {canvasTitle}
                  </span>
                  {published?.subtitle ? (
                    <span
                      className="block truncate text-canvas-micro text-canvas-muted"
                      title={published.subtitle}
                    >
                      {published.subtitle}
                    </span>
                  ) : null}
                </div>
                {published?.action ? (
                  <button
                    type="button"
                    onClick={published.action.run}
                    className="shrink-0 rounded-canvas bg-canvas-ink px-2.5 py-1 text-canvas-micro font-semibold text-canvas-card transition hover:opacity-90"
                  >
                    {published.action.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={toggleLeftPanel}
                  aria-label="Open sidebar"
                  className="btn h-7 w-7 shrink-0 rounded-canvas text-canvas-muted hover:text-canvas-ink"
                >
                  <PanelChevronIcon direction="right" className="h-4 w-4" />
                </button>
              </div>
            }
            expandedContent={
              <>
                <MotionPanelLine
                  key={`header-${staggerKey}`}
                  section={LEFT_PANEL_SECTIONS.header}
                  item={0}
                  staggerActive={lineStaggerActive}
                  className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-1">
                    <FlowstateBrand onLogoClick={onGoHome} />
                  </div>
                  <button
                    type="button"
                    onClick={toggleLeftPanel}
                    aria-label="Collapse sidebar"
                    className="btn h-10 w-10 shrink-0 rounded-canvas text-canvas-muted hover:text-canvas-ink"
                  >
                    <PanelChevronIcon direction="left" />
                  </button>
                </MotionPanelLine>

                {published ? (
                  <MotionPanelLine
                    key={`published-${staggerKey}`}
                    section={LEFT_PANEL_SECTIONS.header}
                    item={1}
                    staggerActive={lineStaggerActive}
                    className="border-b border-canvas-border px-3 py-2.5"
                  >
                    <p
                      className="m-0 truncate text-canvas-body-sm font-medium text-canvas-ink"
                      title={published.title}
                    >
                      {published.title}
                    </p>
                    {published.subtitle ? (
                      <p className="m-0 mt-0.5 text-canvas-micro leading-snug text-canvas-muted">
                        {published.subtitle}
                      </p>
                    ) : null}
                    {published.action ? (
                      <button
                        type="button"
                        onClick={published.action.run}
                        className="mt-2 rounded-canvas bg-canvas-ink px-2.5 py-1 text-canvas-micro font-semibold text-canvas-card transition hover:opacity-90"
                      >
                        {published.action.label}
                      </button>
                    ) : null}
                  </MotionPanelLine>
                ) : null}

                <div className="flex-1 overflow-y-auto">
                  <CanvasesSection
                    key={`canvases-${staggerKey}`}
                    staggerActive={lineStaggerActive}
                  />
                </div>

                <div className="space-y-2 border-t border-canvas-border p-3">
                  <MotionPanelLine
                    section={LEFT_PANEL_SECTIONS.footer}
                    item={0}
                    staggerActive={lineStaggerActive}
                  >
                    <SaveStatusBadge size="panel" />
                  </MotionPanelLine>
                  <MotionPanelLine
                    section={LEFT_PANEL_SECTIONS.footer}
                    item={1}
                    staggerActive={lineStaggerActive}
                  >
                    <AuthButton size="panel" />
                  </MotionPanelLine>
                  <MotionPanelLine
                    section={LEFT_PANEL_SECTIONS.footer}
                    item={2}
                    staggerActive={lineStaggerActive}
                  >
                    <CreditMeter />
                  </MotionPanelLine>
                </div>
              </>
            }
          />
        </aside>
        {viewMode === "canvas" ? <CanvasSearch /> : null}
      </div>
      {collapsed && viewMode === "canvas" ? <ArtifactUpdateCenter /> : null}
    </div>
  );
}
