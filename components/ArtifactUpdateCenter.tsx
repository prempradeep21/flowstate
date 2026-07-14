"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import {
  focusCanvasArtifact,
  focusCanvasArtifactNode,
} from "@/lib/canvasArtifacts";
import { focusCanvasCard } from "@/lib/canvasFocus";
import {
  useArtifactUpdateStore,
  type ArtifactUpdate,
} from "@/lib/artifactUpdateStore";

const VISIBLE_SLOTS = 5;
const ITEM_HEIGHT_PX = 44;
const SCROLL_HEIGHT_PX = ITEM_HEIGHT_PX * VISIBLE_SLOTS;

const SLOT_OPACITY = [1, 1, 1, 0.5, 0.1] as const;

function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReadyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.25 8.1 7 9.85 10.85 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArtifactUpdateRow({
  update,
  opacity,
  onDismiss,
}: {
  update: ArtifactUpdate;
  opacity: number;
  onDismiss: (id: string) => void;
}) {
  const isReady = update.status === "ready";
  const isError = update.status === "error";
  const isInteractive = Boolean(
    update.artifactId || update.nodeId || update.cardId,
  );

  const handleActivate = () => {
    if (update.artifactId) {
      focusCanvasArtifact(update.artifactId);
    } else if (update.nodeId) {
      focusCanvasArtifactNode(update.nodeId);
    } else if (update.cardId) {
      focusCanvasCard(update.cardId);
    }
    onDismiss(update.id);
  };

  return (
    <div
      className="group flex min-h-[44px] items-start gap-2 px-0.5 transition-opacity duration-150"
      style={{ opacity }}
    >
      {isReady ? (
        <ReadyIcon className="mt-0.5 h-4 w-4 shrink-0 text-canvas-success" />
      ) : null}
      {update.kind || update.isVideo ? (
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isReady
              ? "bg-canvas-success-soft text-canvas-success-text"
              : "bg-canvas-artifactIconBg text-canvas-ink"
          }`}
        >
          <ArtifactTypeIcon
            kind={update.isVideo ? "video" : update.kind ?? "custom"}
            faviconUrl={update.isVideo ? undefined : update.faviconUrl}
            className="h-3.5 w-3.5"
          />
        </span>
      ) : null}
      <button
        type="button"
        disabled={!isInteractive}
        onClick={handleActivate}
        className={`min-w-0 flex-1 text-left ${
          isInteractive
            ? "cursor-pointer hover:opacity-90"
            : "cursor-default"
        }`}
      >
        <span
          className={`block [text-shadow:0_1px_12px_rgb(var(--canvas-bg)/0.85)] ${
            isReady
              ? "text-canvas-success-text"
              : isError
                ? "text-canvas-warningText/90"
                : "text-canvas-ink/88"
          }`}
        >
          <span className="line-clamp-1 text-canvas-body-sm font-medium leading-snug">
            {update.title}
          </span>
          <span
            className={`line-clamp-1 text-canvas-compact leading-snug ${
              isReady ? "text-canvas-success/90" : "text-canvas-muted/90"
            }`}
          >
            {update.detail}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onDismiss(update.id)}
        aria-label="Dismiss update"
        className="mt-0.5 shrink-0 rounded p-0.5 text-canvas-muted/0 transition-colors group-hover:text-canvas-muted/70 hover:!text-canvas-ink"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export function ArtifactUpdateCenter() {
  const updates = useArtifactUpdateStore((s) => s.updates);
  const dismissUpdate = useArtifactUpdateStore((s) => s.dismissUpdate);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slotOpacity, setSlotOpacity] = useState<number[]>([...SLOT_OPACITY]);

  const recomputeOpacity = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) {
      setSlotOpacity([...SLOT_OPACITY]);
      return;
    }

    if (el.scrollTop < 2) {
      setSlotOpacity(
        children.map((_, index) => {
          if (index < 3) return 1;
          if (index === 3) return 0.5;
          if (index === 4) return 0.1;
          return 1;
        }),
      );
      return;
    }

    const containerTop = el.getBoundingClientRect().top;
    const next = children.map((child) => {
      const top = child.getBoundingClientRect().top - containerTop;
      const slot = Math.round(top / ITEM_HEIGHT_PX);
      if (slot < 0 || slot >= VISIBLE_SLOTS) return 0;
      return SLOT_OPACITY[slot] ?? 0;
    });
    setSlotOpacity(next);
  }, []);

  useLayoutEffect(() => {
    recomputeOpacity();
  }, [updates, recomputeOpacity]);

  if (updates.length === 0) return null;

  return (
    <div className="artifact-update-center pointer-events-auto w-[min(14rem,32vw)] pl-3">
      <p className="mb-2 text-canvas-compact font-medium text-canvas-muted [text-shadow:0_1px_12px_rgb(var(--canvas-bg)/0.85)]">
        Artifact updates
      </p>
      <div
        ref={scrollRef}
        onScroll={recomputeOpacity}
        className="artifact-update-scroll overflow-y-auto overflow-x-hidden pr-1"
        style={{ maxHeight: SCROLL_HEIGHT_PX }}
      >
        {updates.map((update, index) => (
          <ArtifactUpdateRow
            key={update.id}
            update={update}
            opacity={slotOpacity[index] ?? 1}
            onDismiss={dismissUpdate}
          />
        ))}
      </div>
    </div>
  );
}
