"use client";

import { useEffect, useRef, useState } from "react";
import {
  BranchForkIcon,
  ContextMenuItem,
  TrashIcon,
} from "@/components/MenuIcons";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { useCanvasStore } from "@/lib/store";

interface CardQaMenuProps {
  cardId: string;
  /** Present on canvas cards (shows collapse toggle). Omit in chat view. */
  viewportScale?: number;
  /** Hide delete on the landing/home empty card. */
  hideDelete?: boolean;
  /** Inline in the question header row instead of overlaying the card. */
  layout?: "overlay" | "embedded";
}

function DotsIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="currentColor"
    >
      <circle cx="8" cy="3.25" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="8" cy="12.75" r="1.25" />
    </svg>
  );
}

function ChatCollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {collapsed ? (
        <path d="M6 3l5 5-5 5" />
      ) : (
        <path d="M4 6l4 4 4-4" />
      )}
    </svg>
  );
}

export function CardQaMenu({
  cardId,
  viewportScale,
  hideDelete = false,
  layout = "overlay",
}: CardQaMenuProps) {
  const card = useCanvasStore((s) => s.cards[cardId]);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const deleteFromCard = useCanvasStore((s) => s.deleteFromCard);
  const toggleCardCollapsed = useCanvasStore((s) => s.toggleCardCollapsed);
  const isChatCollapsed = useCanvasStore((s) =>
    s.collapsedCardIds.includes(cardId),
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && el.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  if (!card) return null;

  const isEmpty = card.status === "empty";
  if (isEmpty && hideDelete) return null;
  const canBranch = card.status === "done";
  const isCanvas = viewportScale != null;
  const showCollapseToggle = isCanvas && !isEmpty;

  return (
    <div
      ref={rootRef}
      className={
        layout === "embedded"
          ? "relative z-30 flex items-center gap-0.5"
          : "absolute right-2 top-2 z-30 flex items-center gap-0.5"
      }
    >
      {showCollapseToggle && (
        <button
          type="button"
          aria-label={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          title={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          onClick={(e) => {
            e.stopPropagation();
            toggleCardCollapsed(cardId);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChatCollapseIcon collapsed={isChatCollapsed} />
        </button>
      )}
      <button
        type="button"
        aria-label="Card actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
          open ? "bg-canvas-bg text-canvas-ink" : ""
        }`}
      >
        <DotsIcon />
      </button>

      {open && (
        <MotionFlowSize
          role="menu"
          className="motion-popover-in absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isEmpty ? (
            !hideDelete && (
              <ContextMenuItem
                icon={<TrashIcon />}
                label="Delete"
                onClick={() => {
                  deleteFromCard(cardId);
                  setOpen(false);
                }}
              />
            )
          ) : (
            <>
              <ContextMenuItem
                icon={<BranchForkIcon />}
                label="Pull branch"
                disabled={!canBranch}
                onClick={() => {
                  if (!canBranch) return;
                  createBranch(cardId, "left");
                  setOpen(false);
                }}
              />
              <ContextMenuItem
                icon={<TrashIcon />}
                label="Delete from below"
                onClick={() => {
                  deleteFromCard(cardId);
                  setOpen(false);
                }}
              />
            </>
          )}
        </MotionFlowSize>
      )}
    </div>
  );
}
