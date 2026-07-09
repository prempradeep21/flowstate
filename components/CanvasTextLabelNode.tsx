"use client";

import { memo,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import {
  clampTextLabelFontSize,
  clampTextLabelWidth,
  estimateTextLabelBounds,
  getTextLabelWidth,
  MAX_TEXT_LABEL_WIDTH,
} from "@/lib/canvasTextLabelBounds";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { isCanvasItemSelected } from "@/lib/canvasSelection";
import {
  CANVAS_CONTENT_INERT_CLASS,
  CANVAS_NODE_INTERACTIVE_ATTR,
} from "@/lib/canvasNodeInteraction";
import {
  decrementLocalEditGuard,
  incrementLocalEditGuard,
} from "@/lib/localEditGuard";
import {
  useCanvasStore,
  type CanvasTextLabel,
} from "@/lib/store";
import { fetchYoutubeMeta, isYoutubeUrl } from "@/lib/youtube";

const DRAG_THRESHOLD_PX = 0;
const INTERACTIVE =
  "button, textarea, input, select, a, [role='menu'], [data-no-drag], [data-resize-handle]";

type ResizeCorner = "nw" | "ne" | "sw" | "se";

interface CanvasTextLabelNodeProps {
  label: CanvasTextLabel;
  startEditing?: boolean;
}

function cornerAnchor(
  rect: DOMRect,
  corner: ResizeCorner,
): { x: number; y: number } {
  switch (corner) {
    case "nw":
      return { x: rect.right, y: rect.bottom };
    case "ne":
      return { x: rect.left, y: rect.bottom };
    case "sw":
      return { x: rect.right, y: rect.top };
    case "se":
      return { x: rect.left, y: rect.top };
  }
}

function CornerResizeHandle({
  corner,
  onPointerDown,
}: {
  corner: ResizeCorner;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const positionClass =
    corner === "nw"
      ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"
      : corner === "ne"
        ? "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
        : corner === "sw"
          ? "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"
          : "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize";

  return (
    <button
      type="button"
      data-no-drag
      data-resize-handle
      aria-label={`Resize text (${corner})`}
      onPointerDown={onPointerDown}
      className={`absolute z-40 h-3 w-3 rounded-canvas-xs border border-canvas-ink/35 bg-canvas-card opacity-0 shadow-sm transition-opacity group-hover/textlabel:opacity-100 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30 ${positionClass}`}
    />
  );
}

function WidthResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      data-resize-handle
      aria-label="Resize text width"
      onPointerDown={onPointerDown}
      className="absolute -right-1 top-1/2 z-40 h-8 w-2 -translate-y-1/2 cursor-ew-resize rounded-canvas-xs opacity-0 transition-opacity group-hover/textlabel:opacity-100 hover:bg-canvas-ink/10 hover:opacity-100 focus-visible:bg-canvas-ink/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
    />
  );
}

function CanvasTextLabelNodeInner({
  label,
  startEditing = false,
}: CanvasTextLabelNodeProps) {
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasTextLabelId === label.id ||
      isCanvasItemSelected(s.canvasSelection, "label", label.id),
  );
  const moveCanvasTextLabel = useCanvasStore((s) => s.moveCanvasTextLabel);
  const selectCanvasTextLabel = useCanvasStore((s) => s.selectCanvasTextLabel);
  const updateCanvasTextLabel = useCanvasStore((s) => s.updateCanvasTextLabel);
  const removeCanvasTextLabel = useCanvasStore((s) => s.removeCanvasTextLabel);
  const setCanvasTextLabelFontSize = useCanvasStore(
    (s) => s.setCanvasTextLabelFontSize,
  );
  const setCanvasTextLabelWidth = useCanvasStore(
    (s) => s.setCanvasTextLabelWidth,
  );
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const createVideoArtifactFromUrl = useCanvasStore(
    (s) => s.createVideoArtifactFromUrl,
  );

  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(label.text);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "label",
    nodeId: label.id,
    commitMove: (targetId, dx, dy) => moveCanvasTextLabel(targetId, dx, dy),
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvasTextLabel(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    recordUndo,
  });
  const resizeStateRef = useRef<{
    pointerId: number;
    mode: "corner" | "width";
    corner?: ResizeCorner;
    startX: number;
    startY: number;
    startFontSize: number;
    startWidth: number;
    startDist: number;
    anchorX: number;
    anchorY: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);

  const hasFixedWidth = label.width != null;
  const containerWidth = hasFixedWidth ? label.width : undefined;

  useEffect(() => {
    if (editing) return;
    setDraft(label.text);
  }, [label.text, editing]);

  useEffect(() => {
    if (!editing) return;
    incrementLocalEditGuard();
    return () => decrementLocalEditGuard();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  useLayoutEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing, label.fontSize, hasFixedWidth, containerWidth]);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0) {
      if (trimmed !== label.text) {
        recordUndo();
        updateCanvasTextLabel(label.id, trimmed);
      }
    } else {
      setDraft(label.text);
    }
    setEditing(false);
  };

  const liveBounds = useMemo(
    () => estimateTextLabelBounds({ ...label, text: draft }),
    [label, draft],
  );

  const measuredWidth = () => {
    const el = rootRef.current;
    if (!el) return getTextLabelWidth(label);
    const rect = el.getBoundingClientRect();
    const vpScale = useCanvasStore.getState().viewport.scale;
    return rect.width / vpScale;
  };

  const beginCornerResize = (
    e: ReactPointerEvent<HTMLButtonElement>,
    corner: ResizeCorner,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasTextLabel(label.id);
    const root = rootRef.current;
    if (!root) return;
    root.setPointerCapture(e.pointerId);

    const rect = root.getBoundingClientRect();
    const anchor = cornerAnchor(rect, corner);
    const startDist = Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y);

    resizeStateRef.current = {
      pointerId: e.pointerId,
      mode: "corner",
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startFontSize: label.fontSize,
      startWidth: measuredWidth(),
      startDist: Math.max(startDist, 1),
      anchorX: anchor.x,
      anchorY: anchor.y,
      didMove: false,
      recordedUndo: false,
    };
  };

  const beginWidthResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectCanvasTextLabel(label.id);
    const root = rootRef.current;
    if (!root) return;
    root.setPointerCapture(e.pointerId);

    const startWidth = label.width ?? measuredWidth();

    resizeStateRef.current = {
      pointerId: e.pointerId,
      mode: "width",
      startX: e.clientX,
      startY: e.clientY,
      startFontSize: label.fontSize,
      startWidth,
      startDist: 1,
      anchorX: 0,
      anchorY: 0,
      didMove: false,
      recordedUndo: false,
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || editing) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;

    e.stopPropagation();
    e.preventDefault();
    const st = useCanvasStore.getState();
    const inMultiSelection =
      isCanvasItemSelected(st.canvasSelection, "label", label.id) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      st.toggleCanvasSelectionItem({ kind: "label", id: label.id });
      return;
    }
    if (!inMultiSelection) selectCanvasTextLabel(label.id);
    if (st.canvasReadOnly) return;
    nodeDrag.start(e, {
      moveSelection: inMultiSelection && !e.altKey,
      copyOnDrag: e.altKey,
    });
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      const screenDx = e.clientX - rs.startX;
      const screenDy = e.clientY - rs.startY;
      const dist = Math.hypot(screenDx, screenDy);
      if (!rs.didMove && dist < DRAG_THRESHOLD_PX) return;

      if (!rs.recordedUndo) {
        recordUndo();
        rs.recordedUndo = true;
      }
      rs.didMove = true;

      const vpScale = useCanvasStore.getState().viewport.scale;

      if (rs.mode === "width") {
        const nextWidth = clampTextLabelWidth(
          rs.startWidth + screenDx / vpScale,
        );
        setCanvasTextLabelWidth(label.id, nextWidth);
        return;
      }

      const currentDist = Math.hypot(
        e.clientX - rs.anchorX,
        e.clientY - rs.anchorY,
      );
      const scale = currentDist / rs.startDist;
      setCanvasTextLabelFontSize(
        label.id,
        clampTextLabelFontSize(rs.startFontSize * scale),
      );
      return;
    }

    if (editing) return;
    nodeDrag.move(e);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      resizeStateRef.current = null;
      return;
    }

    nodeDrag.end(e);
  };

  const contentInteractive = isSelected || editing;

  return (
    <div
      ref={rootRef}
      data-canvas-text-label
      data-canvas-node-id={label.id}
      {...(contentInteractive ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`group/textlabel absolute cursor-grab active:cursor-grabbing ${
        isSelected ? "z-30" : "z-20"
      } ${hasFixedWidth || editing ? "" : "w-max"}`}
      style={{
        left: label.position.x,
        top: label.position.y,
        width: hasFixedWidth ? containerWidth : editing ? liveBounds.w : undefined,
        minHeight: editing ? liveBounds.h : undefined,
        // The viewport wrapper has zero intrinsic size, so percentage-based
        // max-widths collapse to 0 — cap with the absolute label maximum.
        maxWidth: MAX_TEXT_LABEL_WIDTH,
      }}
    >
      <CanvasSharpContent
        worldWidth={
          typeof containerWidth === "number" ? containerWidth : undefined
        }
        className={!contentInteractive ? CANVAS_CONTENT_INERT_CLASS : undefined}
      >
        {editing ? (
          <textarea
            ref={inputRef}
            data-no-drag
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text/plain");
              const url = text.trim();
              if (!isYoutubeUrl(url)) return;
              e.preventDefault();
              const position = label.position;
              void (async () => {
                const meta = await fetchYoutubeMeta(url);
                createVideoArtifactFromUrl(url, {
                  title: meta.title,
                  thumb: meta.thumb,
                  position,
                });
                removeCanvasTextLabel(label.id);
              })();
            }}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft(label.text);
                setEditing(false);
              }
              e.stopPropagation();
            }}
            className={`block min-h-0 w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-medium leading-tight text-canvas-ink outline-none ring-2 ring-canvas-ink/25 ${
              hasFixedWidth ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            }`}
            style={{
              fontSize: label.fontSize,
            }}
          />
        ) : (
          <div
            className={`break-words font-medium leading-tight text-canvas-ink ${
              hasFixedWidth ? "whitespace-pre-wrap" : "whitespace-pre"
            } ${
              isSelected
                ? "ring-2 ring-canvas-ink/25 ring-offset-2 ring-offset-transparent"
                : ""
            }`}
            style={{ fontSize: label.fontSize }}
          >
            {label.text}
          </div>
        )}
      </CanvasSharpContent>

      {isSelected && !editing && (
        <>
          <CornerResizeHandle
            corner="nw"
            onPointerDown={(e) => beginCornerResize(e, "nw")}
          />
          <CornerResizeHandle
            corner="ne"
            onPointerDown={(e) => beginCornerResize(e, "ne")}
          />
          <CornerResizeHandle
            corner="sw"
            onPointerDown={(e) => beginCornerResize(e, "sw")}
          />
          <CornerResizeHandle
            corner="se"
            onPointerDown={(e) => beginCornerResize(e, "se")}
          />
          <WidthResizeHandle onPointerDown={beginWidthResize} />
        </>
      )}
    </div>
  );
}

/**
 * Memoized: re-renders only when its own props are replaced; store data
 * comes from narrow selectors inside (matches Card's memo contract).
 */
export const CanvasTextLabelNode = memo(
  CanvasTextLabelNodeInner,
  (prev, next) =>
    prev.label === next.label && prev.startEditing === next.startEditing,
);
