"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CanvasFloatingMenuPortal,
  useCanvasFloatingMenuPosition,
} from "@/components/CanvasFloatingMenu";
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
  layout?: "overlay" | "embedded" | "cta";
}

function DotsIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-5 w-5"
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
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {collapsed ? (
        <path d="M4 6l4 4 4-4" />
      ) : (
        <path d="M4 10l4-4 4 4" />
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
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const isCanvas = viewportScale != null;
  const menuPortal = useCanvasFloatingMenuPosition(
    open && isCanvas,
    menuButtonRef,
    layout === "cta" ? "top-end" : "bottom-end",
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuPortal.portalRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, menuPortal.portalRef]);

  if (!card) return null;

  const isEmpty = card.status === "empty";
  if (isEmpty && hideDelete) return null;
  const canBranch = card.status === "done";
  const showCollapseToggle = isCanvas && !isEmpty;

  const rootClassName =
    layout === "embedded"
      ? "relative z-30 flex flex-row items-center gap-0.5"
      : layout === "cta"
        ? "absolute right-3 z-30 flex flex-row items-center gap-0.5"
        : "absolute right-2 top-2 z-30 flex flex-row items-center gap-0.5";

  const rootStyle: CSSProperties | undefined =
    layout === "cta"
      ? {
          // Sit above the send / expand CTA (composer row padding + button height).
          bottom: "calc(0.625rem + 0.5rem + 2.25rem + 0.375rem)",
        }
      : undefined;

  const menuClassName =
    "motion-popover-in min-w-[200px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card";

  const menuContent = (
    <MotionFlowSize
      role="menu"
      className={menuClassName}
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
  );

  return (
    <div ref={rootRef} className={rootClassName} style={rootStyle}>
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
          className="flex h-8 w-8 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChatCollapseIcon collapsed={isChatCollapsed} />
        </button>
      )}
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Card actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex h-8 w-8 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
          open ? "bg-canvas-bg text-canvas-ink" : ""
        }`}
      >
        <DotsIcon />
      </button>

      {open &&
        (isCanvas ? (
          <CanvasFloatingMenuPortal
            open={open}
            style={menuPortal.style}
            portalRef={menuPortal.portalRef}
          >
            {menuContent}
          </CanvasFloatingMenuPortal>
        ) : (
          <div
            className={`absolute right-0 z-50 ${
              layout === "cta" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            {menuContent}
          </div>
        ))}
    </div>
  );
}
