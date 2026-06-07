"use client";

import { useRef, useState } from "react";
import {
  BranchForkIcon,
  ChatBubbleIcon,
  QuestionIcon,
  SettingsIcon,
  ShareIcon,
  TypeIcon,
} from "@/components/MenuIcons";
import { CanvasSettingsPopover } from "@/components/CanvasSettingsPopover";
import { UndoButton } from "@/components/UndoButton";
import { useCanEditCanvas, useAuth } from "@/components/AuthProvider";
import { isCanvasOwner } from "@/lib/collaborationPersistence";
import { useClientMounted } from "@/hooks/useClientMounted";
import { useCanvasStore } from "@/lib/store";

const toolbarBtn =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

const iconToggleBtn =
  "flex h-9 w-9 items-center justify-center rounded-md transition-colors";

export function CanvasBottomToolbar() {
  const mounted = useClientMounted();
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const canEdit = useCanEditCanvas();
  const { activeCanvasRole, setShareModalOpen, user, activeCanvasId } = useAuth();
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);
  const requestCanvasPlacement = useCanvasStore((s) => s.requestCanvasPlacement);
  const activeCanvasPlacement = useCanvasStore((s) => s.activeCanvasPlacement);

  const showShare =
    Boolean(user && activeCanvasId) && isCanvasOwner(activeCanvasRole);

  if (!mounted) {
    return (
      <div
        className="pointer-events-none absolute bottom-5 left-1/2 z-50 h-[52px] w-[min(100%,420px)] -translate-x-1/2 rounded-xl border border-transparent"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-50 -translate-x-1/2">
      <CanvasSettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        anchorRef={settingsBtnRef}
      />
      <div
        className="flex items-center gap-1 rounded-xl border border-canvas-border bg-canvas-card p-1.5 shadow-card"
        role="toolbar"
        aria-label="Canvas tools"
      >
      <button
        type="button"
        disabled={!canEdit}
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
        disabled={!canEdit}
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

      {canEdit && <UndoButton variant="toolbar" />}

      {showShare && (
        <>
          <div className="mx-1 h-7 w-px shrink-0 bg-canvas-border" aria-hidden />
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => setShareModalOpen(true)}
          >
            <span className="text-canvas-muted">
              <ShareIcon />
            </span>
            Share
          </button>
        </>
      )}

      <div
        className="mx-1 h-7 w-px shrink-0 bg-canvas-border"
        aria-hidden
      />

      <button
        ref={settingsBtnRef}
        type="button"
        className={`${iconToggleBtn} ${
          settingsOpen
            ? "bg-canvas-bg text-canvas-ink"
            : "text-canvas-muted hover:text-canvas-ink"
        }`}
        aria-label="Canvas settings"
        aria-expanded={settingsOpen}
        aria-haspopup="dialog"
        onClick={() => setSettingsOpen((v) => !v)}
      >
        <SettingsIcon />
      </button>

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
          aria-label="Canvas view"
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
    </div>
  );
}
