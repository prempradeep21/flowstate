"use client";

import { memo,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import {
  clampTextLabelFontSize,
  clampTextLabelWidth,
  MAX_TEXT_LABEL_WIDTH,
} from "@/lib/canvasTextLabelBounds";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import { CANVAS_HOTKEYS_OFF_ATTR } from "@/lib/canvasHotkeys";
import { useCanvasNodeDrag } from "@/hooks/useCanvasNodeDrag";
import { useCanvasSelectionUnitCount } from "@/hooks/useCanvasSelectionUnitCount";
import {
  commitGroupMoveForItem,
  groupRefsForItemDrag,
} from "@/lib/groupMembership";
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
import { useRaisedZIndex } from "@/hooks/useRaisedZIndex";

/** Screen px of movement before a press on the label becomes a drag. */
const DRAG_THRESHOLD_PX = 3;
/** Screen px before a handle press becomes a resize (lets double-click through). */
const RESIZE_THRESHOLD_PX = 2;
const INTERACTIVE =
  "button, textarea, input, select, a, [role='menu'], [data-no-drag], [data-resize-handle]";

/** Marks the live editor so window-level canvas shortcuts leave its keys alone. */
export const CANVAS_TEXT_EDITOR_ATTR = "data-canvas-text-editor";

/** Shared by the rendered text and the editor so they lay out identically. */
const TYPOGRAPHY = "font-medium leading-tight text-canvas-ink";
/** Chrome is a fixed world size — it scales with the label, never on zoom. */
const CHROME_PX = (px: number) => `${px}px`;

type ResizeCorner = "nw" | "ne" | "sw" | "se";
type ResizeEdge = "w" | "e";

/** Where the caret / selection goes when an edit session opens. */
type EditEntry = "all" | { start: number; end: number };

/**
 * Auto-edit is a one-shot: a culled-then-remounted label must not reopen its
 * editor just because Canvas still remembers it as the last placement.
 */
const consumedAutoEdit = new Set<string>();

interface CanvasTextLabelNodeProps {
  label: CanvasTextLabel;
  startEditing?: boolean;
}

/** Character offset inside `container`'s text under a viewport point. */
function textOffsetAtPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
): number | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  let node: Node | null = null;
  let offset = 0;
  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(clientX, clientY);
    if (pos) {
      node = pos.offsetNode;
      offset = pos.offset;
    }
  } else if (typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node || !container.contains(node)) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n === node) return total + offset;
    total += n.textContent?.length ?? 0;
  }
  return null;
}

/** The word around `offset` — what a double-click selects in any text editor. */
function wordRangeAt(
  text: string,
  offset: number,
): { start: number; end: number } {
  const at = Math.max(0, Math.min(offset, text.length));
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segments = [
      ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text),
    ];
    // Prefer the word the offset is inside; a click on a word's trailing
    // half reports the offset just after it, so fall back one character.
    for (const probe of [at, at - 1]) {
      const hit = segments.find(
        (s) => probe >= s.index && probe < s.index + s.segment.length,
      );
      if (hit?.isWordLike) {
        return { start: hit.index, end: hit.index + hit.segment.length };
      }
    }
    return { start: at, end: at };
  }
  const isWord = (c: string | undefined) => !!c && /[\p{L}\p{N}_'’]/u.test(c);
  let start = at;
  let end = at;
  if (!isWord(text[at]) && isWord(text[at - 1])) start = end = at - 1;
  while (start > 0 && isWord(text[start - 1])) start--;
  while (end < text.length && isWord(text[end])) end++;
  return { start, end };
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(
    el.closest(
      "input, textarea, select, button, a, [contenteditable='true'], [role='menu'], [role='dialog']",
    ),
  );
}

function CornerHandle({
  corner,
  onPointerDown,
}: {
  corner: ResizeCorner;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const size = CHROME_PX(8);
  return (
    <button
      type="button"
      tabIndex={-1}
      data-no-drag
      data-resize-handle
      aria-label={`Resize text (${corner})`}
      onPointerDown={onPointerDown}
      className={`absolute z-40 rounded-[1px] bg-white ${
        corner === "nw" || corner === "se"
          ? "cursor-nwse-resize"
          : "cursor-nesw-resize"
      }`}
      style={{
        width: size,
        height: size,
        left: corner === "nw" || corner === "sw" ? 0 : "100%",
        top: corner === "nw" || corner === "ne" ? 0 : "100%",
        transform: "translate(-50%, -50%)",
        boxShadow: `0 0 0 ${CHROME_PX(1)} rgb(var(--canvas-accent))`,
      }}
    />
  );
}

function EdgeHandle({
  edge,
  onPointerDown,
  onDoubleClick,
}: {
  edge: ResizeEdge;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-no-drag
      data-resize-handle
      aria-label={`Resize text width (${edge === "w" ? "left" : "right"})`}
      title="Drag to set width · double-click for auto width"
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      className="absolute bottom-0 top-0 z-30 cursor-ew-resize bg-transparent"
      style={{
        width: CHROME_PX(8),
        left: edge === "w" ? 0 : "100%",
        transform: "translateX(-50%)",
      }}
    />
  );
}

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  didMove: boolean;
  startPos: { x: number; y: number };
  /** Rendered box in world px at gesture start. */
  startW: number;
  startH: number;
  startFontSize: number;
  /** Fixed wrap width at gesture start (undefined = auto width). */
  startFixedWidth: number | undefined;
} & (
  | {
      mode: "corner";
      corner: ResizeCorner;
      anchorX: number;
      anchorY: number;
      startDist: number;
    }
  | { mode: "edge"; edge: ResizeEdge }
);

function CanvasTextLabelNodeInner({
  label,
  startEditing = false,
}: CanvasTextLabelNodeProps) {
  const raisedZIndex = useRaisedZIndex(label.id);
  const isSelected = useCanvasStore(
    (s) =>
      s.selectedCanvasTextLabelId === label.id ||
      isCanvasItemSelected(s.canvasSelection, "label", label.id),
  );
  const readOnly = useCanvasStore((s) => s.canvasReadOnly);
  const selectionUnitCount = useCanvasSelectionUnitCount();
  /** One member of a larger selection — the shared bounds box owns the grips. */
  const isSelectionMember = isSelected && selectionUnitCount > 1;
  const moveCanvasTextLabel = useCanvasStore((s) => s.moveCanvasTextLabel);
  const selectCanvasTextLabel = useCanvasStore((s) => s.selectCanvasTextLabel);
  const transformCanvasTextLabel = useCanvasStore(
    (s) => s.transformCanvasTextLabel,
  );
  const finishCanvasTextLabelEdit = useCanvasStore(
    (s) => s.finishCanvasTextLabelEdit,
  );
  const removeCanvasTextLabel = useCanvasStore((s) => s.removeCanvasTextLabel);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const createVideoArtifactFromUrl = useCanvasStore(
    (s) => s.createVideoArtifactFromUrl,
  );

  const [editing, setEditing] = useState(
    () => startEditing && !consumedAutoEdit.has(label.id),
  );
  const [draft, setDraft] = useState(label.text);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // Refs mirror the edit session so blur, Escape and outside-press can all
  // try to close it without double-committing.
  const editingRef = useRef(editing);
  const draftRef = useRef(label.text);
  const createdEmptyRef = useRef(label.text.length === 0);
  const editEntryRef = useRef<EditEntry>("all");
  const resizeStateRef = useRef<ResizeState | null>(null);

  // Imperative drag via the shared gesture layer — one store commit on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "label",
    nodeId: label.id,
    thresholdPx: DRAG_THRESHOLD_PX,
    commitMove: (targetId, dx, dy) => {
      if (!commitGroupMoveForItem("label", targetId, dx, dy)) {
        moveCanvasTextLabel(targetId, dx, dy);
      }
    },
    resolveRefs: (targetId) =>
      groupRefsForItemDrag("label", targetId) ?? [
        { kind: "label", id: targetId },
      ],
    makeCopy: (id) => useCanvasStore.getState().duplicateCanvasTextLabel(id),
    onDragStart: (targetId) => clearSpawnMetaIfDragging(targetId),
    recordUndo,
  });

  const hasFixedWidth = label.width != null;

  useEffect(() => {
    if (startEditing) consumedAutoEdit.add(label.id);
  }, [startEditing, label.id]);

  const beginEditing = (entry: EditEntry) => {
    if (editingRef.current || useCanvasStore.getState().canvasReadOnly) return;
    editEntryRef.current = entry;
    createdEmptyRef.current = label.text.length === 0;
    draftRef.current = label.text;
    setDraft(label.text);
    editingRef.current = true;
    setEditing(true);
    selectCanvasTextLabel(label.id);
  };

  /** Close the edit session, keeping what was typed (Figma / tldraw semantics). */
  const finishEditing = () => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    finishCanvasTextLabelEdit(label.id, draftRef.current, {
      createdEmpty: createdEmptyRef.current,
    });
  };
  const finishEditingRef = useRef(finishEditing);
  finishEditingRef.current = finishEditing;

  useEffect(() => {
    if (!editing) return;
    incrementLocalEditGuard();
    return () => decrementLocalEditGuard();
  }, [editing]);

  // Focus + place the caret before paint so the first frame is already live.
  useLayoutEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    // preventScroll: focusing must never nudge the canvas container.
    el.focus({ preventScroll: true });
    const entry = editEntryRef.current;
    if (entry === "all") el.select();
    else el.setSelectionRange(entry.start, entry.end);
  }, [editing]);

  // A press anywhere outside the editor ends the session. Blur alone misses
  // presses on canvas nodes, which preventDefault their pointerdown and so
  // never move focus.
  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (e: PointerEvent) => {
      const input = inputRef.current;
      if (input && e.target instanceof Node && input.contains(e.target)) return;
      finishEditingRef.current();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [editing]);

  // Enter on a selected label opens it for editing with all text selected.
  const canEnterToEdit = isSelected && !isSelectionMember && !editing && !readOnly;
  useEffect(() => {
    if (!canEnterToEdit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      beginEditing("all");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // beginEditing reads only refs + the latest label via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEnterToEdit, label.text]);

  const worldScale = () => useCanvasStore.getState().viewport.scale;

  /** Rendered box in world px (the DOM is the truth; bounds are estimates). */
  const measureBox = () => {
    const root = rootRef.current;
    const scale = worldScale();
    if (!root) return { w: label.width ?? 0, h: label.fontSize * 1.25 };
    const rect = root.getBoundingClientRect();
    return { w: rect.width / scale, h: rect.height / scale };
  };

  const beginResize = (
    e: ReactPointerEvent<HTMLButtonElement>,
    target: { corner: ResizeCorner } | { edge: ResizeEdge },
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const root = rootRef.current;
    if (!root) return;
    // Capture on the handle: moves still bubble to the root's handlers, and a
    // double-click lands on the handle (edge double-click = auto width).
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer ids can't be captured.
    }
    const { w, h } = measureBox();
    const base = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      didMove: false,
      startPos: { ...label.position },
      startW: w,
      startH: h,
      startFontSize: label.fontSize,
      startFixedWidth: label.width,
    };
    if ("corner" in target) {
      // Scale about the opposite corner, which stays pinned on screen.
      const rect = root.getBoundingClientRect();
      const anchorX =
        target.corner === "nw" || target.corner === "sw" ? rect.right : rect.left;
      const anchorY =
        target.corner === "nw" || target.corner === "ne" ? rect.bottom : rect.top;
      resizeStateRef.current = {
        ...base,
        mode: "corner",
        corner: target.corner,
        anchorX,
        anchorY,
        startDist: Math.max(
          Math.hypot(e.clientX - anchorX, e.clientY - anchorY),
          1,
        ),
      };
    } else {
      resizeStateRef.current = { ...base, mode: "edge", edge: target.edge };
    }
  };

  const resetToAutoWidth = () => {
    if (label.width == null) return;
    recordUndo();
    transformCanvasTextLabel(label.id, { width: null });
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (editing) {
      // Native caret placement / text selection inside the editor; keep the
      // press away from canvas gestures underneath.
      e.stopPropagation();
      return;
    }
    if (e.button !== 0) return;
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
      if (!rs.didMove) {
        const dist = Math.hypot(e.clientX - rs.startX, e.clientY - rs.startY);
        if (dist < RESIZE_THRESHOLD_PX) return;
        recordUndo();
        rs.didMove = true;
      }
      const scale = worldScale();

      if (rs.mode === "edge") {
        const dxWorld = (e.clientX - rs.startX) / scale;
        const width = clampTextLabelWidth(
          rs.startW + (rs.edge === "e" ? dxWorld : -dxWorld),
        );
        transformCanvasTextLabel(label.id, {
          width,
          // The left edge moves with the pointer; the right edge stays put.
          position:
            rs.edge === "w"
              ? { x: rs.startPos.x + rs.startW - width, y: rs.startPos.y }
              : undefined,
        });
        return;
      }

      const dist = Math.hypot(e.clientX - rs.anchorX, e.clientY - rs.anchorY);
      const fontSize = clampTextLabelFontSize(
        (rs.startFontSize * dist) / rs.startDist,
      );
      const k = fontSize / rs.startFontSize;
      const w = rs.startW * k;
      const h = rs.startH * k;
      const pinLeft = rs.corner === "ne" || rs.corner === "se";
      const pinTop = rs.corner === "sw" || rs.corner === "se";
      transformCanvasTextLabel(label.id, {
        fontSize,
        // Wrapped text scales its box too, so line breaks don't reflow.
        width:
          rs.startFixedWidth != null ? rs.startFixedWidth * k : undefined,
        position: {
          x: pinLeft ? rs.startPos.x : rs.startPos.x + rs.startW - w,
          y: pinTop ? rs.startPos.y : rs.startPos.y + rs.startH - h,
        },
      });
      return;
    }

    if (editing) return;
    nodeDrag.move(e);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rs = resizeStateRef.current;
    if (rs && rs.pointerId === e.pointerId) {
      resizeStateRef.current = null;
      return;
    }
    nodeDrag.end(e);
  };

  const handleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (editing) return;
    // Double-click selects the word under the pointer, as in any text editor.
    const textEl = textRef.current;
    const offset = textEl
      ? textOffsetAtPoint(textEl, e.clientX, e.clientY)
      : null;
    beginEditing(
      offset == null || label.text.length === 0
        ? "all"
        : wordRangeAt(label.text, Math.min(offset, label.text.length)),
    );
  };

  const contentInteractive = isSelected || editing;
  const shownText = editing ? draft : label.text;
  // A trailing newline (or no text) still owns a line box — the zero-width
  // space gives the mirror that line so the caret has somewhere to sit.
  const needsFiller = shownText.length === 0 || shownText.endsWith("\n");
  const wrapClass = hasFixedWidth
    ? "whitespace-pre-wrap break-words"
    : "whitespace-pre";
  const showFrame = isSelected || editing;
  const showHandles = isSelected && !editing && !isSelectionMember && !readOnly;

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
      onDoubleClick={handleDoubleClick}
      className={`group/textlabel absolute ${
        editing ? "cursor-text" : "cursor-grab active:cursor-grabbing"
      } ${isSelected ? "z-30" : "z-20"} ${hasFixedWidth ? "" : "w-max"}`}
      style={{
        zIndex: raisedZIndex,
        left: label.position.x,
        top: label.position.y,
        width: hasFixedWidth ? label.width : undefined,
        // The viewport wrapper has zero intrinsic size, so percentage-based
        // max-widths collapse to 0 — cap with the absolute label maximum.
        maxWidth: MAX_TEXT_LABEL_WIDTH,
      }}
    >
      <CanvasSharpContent
        worldWidth={hasFixedWidth ? label.width : undefined}
        className={!contentInteractive ? CANVAS_CONTENT_INERT_CLASS : undefined}
      >
        <div className="relative">
          {/* The rendered text doubles as the editor's sizing mirror, so the
              box is the same size while editing as after — no jump on
              commit, and it grows exactly with what's typed. */}
          <div
            ref={textRef}
            aria-hidden={editing || undefined}
            className={`${TYPOGRAPHY} ${wrapClass} ${editing ? "invisible" : ""}`}
            style={{ fontSize: label.fontSize }}
          >
            {shownText}
            {needsFiller ? "​" : null}
          </div>
          {editing && (
            <textarea
              ref={inputRef}
              data-no-drag
              {...{ [CANVAS_TEXT_EDITOR_ATTR]: "", [CANVAS_HOTKEYS_OFF_ATTR]: "off" }}
              aria-label="Edit text"
              value={draft}
              rows={1}
              wrap={hasFixedWidth ? "soft" : "off"}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              onChange={(e) => {
                draftRef.current = e.target.value;
                setDraft(e.target.value);
              }}
              // The textarea sits exactly on the mirror; it must never scroll
              // its own content out from under it.
              onScroll={(e) => {
                e.currentTarget.scrollTop = 0;
                e.currentTarget.scrollLeft = 0;
              }}
              onPaste={(e) => {
                const url = e.clipboardData.getData("text/plain").trim();
                if (!isYoutubeUrl(url)) return;
                e.preventDefault();
                const position = label.position;
                editingRef.current = false;
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
              onBlur={() => finishEditing()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.nativeEvent.isComposing) return;
                if (
                  e.key === "Escape" ||
                  (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                ) {
                  e.preventDefault();
                  finishEditing();
                }
              }}
              className={`absolute left-0 top-0 m-0 block h-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none selection:bg-canvas-accent/30 ${TYPOGRAPHY} ${wrapClass}`}
              style={{
                fontSize: label.fontSize,
                // Auto width: a sliver of slack so the caret at the end of the
                // longest line isn't clipped. Wrapped: exact, so lines break
                // where the mirror's do.
                width: hasFixedWidth ? "100%" : "calc(100% + 4px)",
              }}
            />
          )}
        </div>
      </CanvasSharpContent>

      {showFrame ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `0 0 0 ${CHROME_PX(1)} rgb(var(--canvas-accent))`,
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-75 group-hover/textlabel:opacity-100"
          style={{
            boxShadow: `0 0 0 ${CHROME_PX(1)} rgb(var(--canvas-accent) / 0.6)`,
          }}
        />
      )}

      {showHandles && (
        <>
          <EdgeHandle
            edge="w"
            onPointerDown={(e) => beginResize(e, { edge: "w" })}
            onDoubleClick={resetToAutoWidth}
          />
          <EdgeHandle
            edge="e"
            onPointerDown={(e) => beginResize(e, { edge: "e" })}
            onDoubleClick={resetToAutoWidth}
          />
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <CornerHandle
              key={corner}
              corner={corner}
              onPointerDown={(e) => beginResize(e, { corner })}
            />
          ))}
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
