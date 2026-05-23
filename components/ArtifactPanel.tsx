"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { groupHasNewSummaryContent } from "@/lib/groupSummaryStaleness";
import { MARKDOWN_COMPONENTS } from "@/lib/markdownComponents";
import { getArtifactMarkdown } from "@/lib/artifacts";
import {
  downloadGroupMarkdown,
  refreshGroupSummary,
} from "@/lib/summarizeGroup";
import { useCanvasStore } from "@/lib/store";

const PANEL_WIDTH = 480;

export function ArtifactPanel() {
  const openCardId = useCanvasStore((s) => s.openArtifactCardId);
  const openGroupId = useCanvasStore((s) => s.openGroupArtifactId);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const card = useCanvasStore((s) =>
    openCardId ? s.cards[openCardId] : undefined,
  );
  const group = useCanvasStore((s) =>
    openGroupId ? s.groups[openGroupId] : undefined,
  );
  const canRefresh = useCanvasStore((s) => {
    const g = openGroupId ? s.groups[openGroupId] : undefined;
    return g ? groupHasNewSummaryContent(s, g) : false;
  });
  const closeArtifact = useCanvasStore((s) => s.closeArtifact);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const cardMarkdown = getArtifactMarkdown(card?.artifactId);
  const groupMarkdown = group?.summaryMarkdown ?? null;
  const markdown = groupMarkdown ?? cardMarkdown;
  const isOpen = Boolean(markdown && (openGroupId || openCardId));
  const title = group ? group.label : "Document";

  useEffect(() => {
    if (!openGroupId) {
      setRefreshError(null);
      setRefreshing(false);
    }
  }, [openGroupId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeArtifact();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeArtifact]);

  const handleRefresh = async () => {
    if (!openGroupId || !canRefresh) return;
    setRefreshError(null);
    setRefreshing(true);
    const result = await refreshGroupSummary(openGroupId, selectedModel);
    setRefreshing(false);
    if (!result.ok) setRefreshError(result.error);
  };

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeArtifact}
        className={`fixed inset-0 z-40 bg-canvas-ink/15 transition-opacity duration-200 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Attached document"
        aria-hidden={!isOpen}
        style={{ width: PANEL_WIDTH }}
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-canvas-border bg-canvas-card shadow-cardHover transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex flex-col gap-1 border-b border-canvas-border px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
                {group ? "Summary" : "Document"}
              </div>
              {group && (
                <div className="truncate text-[13px] font-medium text-canvas-ink">
                  {title}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {group && groupMarkdown && (
                <>
                  <button
                    type="button"
                    onClick={() => downloadGroupMarkdown(group)}
                    className="rounded-md px-2 py-1 text-[12px] text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    disabled={!canRefresh || refreshing}
                    onClick={handleRefresh}
                    className="rounded-md px-2 py-1 text-[12px] text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </button>
                </>
              )}
              <button
                type="button"
                aria-label="Close document"
                onClick={closeArtifact}
                className="flex h-7 w-7 items-center justify-center rounded-md text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 3.5 12.5 12.5" />
                  <path d="M12.5 3.5 3.5 12.5" />
                </svg>
              </button>
            </div>
          </div>
          {refreshError && (
            <p className="text-[11px] text-red-600">{refreshError}</p>
          )}
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 text-[14px] leading-relaxed text-canvas-ink">
          {markdown && (
            <ReactMarkdown components={MARKDOWN_COMPONENTS}>
              {markdown}
            </ReactMarkdown>
          )}
        </div>
      </aside>
    </>
  );
}
