"use client";

import {
  BranchForkIcon,
  ChatBubbleIcon,
  QuestionIcon,
  TypeIcon,
} from "@/components/MenuIcons";
import { useCanvasStore } from "@/lib/store";

const toolbarBtn =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

const iconToggleBtn =
  "flex h-9 w-9 items-center justify-center rounded-md transition-colors";

export function CanvasBottomToolbar() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);
  const requestCanvasPlacement = useCanvasStore((s) => s.requestCanvasPlacement);
  const activeCanvasPlacement = useCanvasStore((s) => s.activeCanvasPlacement);

  return (
    <div
      className="pointer-events-auto absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-canvas-border bg-canvas-card p-1.5 shadow-card"
      role="toolbar"
      aria-label="Canvas tools"
    >
      <button
        type="button"
        className={`${toolbarBtn} ${
          activeCanvasPlacement === "question"
            ? "bg-canvas-bg text-canvas-ink"
            : ""
        }`}
        aria-pressed={activeCanvasPlacement === "question"}
        onClick={() => requestCanvasPlacement("question")}
      >
        <span className="text-canvas-muted">
          <QuestionIcon />
        </span>
        Add question
      </button>
      <button
        type="button"
        className={`${toolbarBtn} ${
          activeCanvasPlacement === "text" ? "bg-canvas-bg text-canvas-ink" : ""
        }`}
        aria-pressed={activeCanvasPlacement === "text"}
        onClick={() => requestCanvasPlacement("text")}
      >
        <span className="text-canvas-muted">
          <TypeIcon />
        </span>
        Add text
      </button>

      <div
        className="mx-1 h-7 w-px shrink-0 bg-canvas-border"
        aria-hidden
      />

      <div
        className="flex rounded-lg bg-canvas-bg p-0.5"
        role="group"
        aria-label="View mode"
      >
        <button
          type="button"
          className={`${iconToggleBtn} ${
            viewMode === "canvas"
              ? "bg-canvas-ink text-canvas-card shadow-card"
              : "text-canvas-muted hover:text-canvas-ink"
          }`}
          aria-label="Branch view"
          aria-pressed={viewMode === "canvas"}
          onClick={() => setViewMode("canvas")}
        >
          <BranchForkIcon />
        </button>
        <button
          type="button"
          className={`${iconToggleBtn} ${
            viewMode === "chat"
              ? "bg-canvas-ink text-canvas-card shadow-card"
              : "text-canvas-muted hover:text-canvas-ink"
          }`}
          aria-label="Chat view"
          aria-pressed={viewMode === "chat"}
          onClick={() => setViewMode("chat")}
        >
          <ChatBubbleIcon />
        </button>
      </div>
    </div>
  );
}
