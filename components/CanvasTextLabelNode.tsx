"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useCanvasStore,
  type CanvasTextLabel,
} from "@/lib/store";

const DRAG_THRESHOLD_PX = 4;
const INTERACTIVE =
  "button, textarea, input, select, a, [role='menu'], [data-no-drag]";

interface CanvasTextLabelNodeProps {
  label: CanvasTextLabel;
  startEditing?: boolean;
}

export function CanvasTextLabelNode({
  label,
  startEditing = false,
}: CanvasTextLabelNodeProps) {
  const selectedCanvasTextLabelId = useCanvasStore(
    (s) => s.selectedCanvasTextLabelId,
  );
  const moveCanvasTextLabel = useCanvasStore((s) => s.moveCanvasTextLabel);
  const selectCanvasTextLabel = useCanvasStore((s) => s.selectCanvasTextLabel);
  const updateCanvasTextLabel = useCanvasStore((s) => s.updateCanvasTextLabel);
  const recordUndo = useCanvasStore((s) => s.recordUndo);

  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(label.text);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    didMove: boolean;
    recordedUndo: boolean;
  } | null>(null);

  const isSelected = selectedCanvasTextLabelId === label.id;
  const inputWidthCh = Math.max(draft.length, 4);

  useEffect(() => {
    setDraft(label.text);
  }, [label.text]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== label.text) {
      recordUndo();
      updateCanvasTextLabel(label.id, trimmed);
    } else if (trimmed.length === 0) {
      setDraft(label.text);
    }
    setEditing(false);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || editing) return;
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;

    e.stopPropagation();
    e.preventDefault();
    selectCanvasTextLabel(label.id);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      didMove: false,
      recordedUndo: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId || editing) return;

    const screenDx = e.clientX - ds.lastX;
    const screenDy = e.clientY - ds.lastY;
    const dist = Math.hypot(screenDx, screenDy);
    if (!ds.didMove && dist < DRAG_THRESHOLD_PX) return;

    if (!ds.recordedUndo) {
      recordUndo();
      ds.recordedUndo = true;
    }
    ds.didMove = true;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    const vpScale = useCanvasStore.getState().viewport.scale;
    moveCanvasTextLabel(label.id, screenDx / vpScale, screenDy / vpScale);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStateRef.current = null;
  };

  return (
    <div
      data-canvas-text-label
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`absolute w-max cursor-grab active:cursor-grabbing ${
        isSelected ? "z-30" : "z-20"
      }`}
      style={{
        left: label.position.x,
        top: label.position.y,
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          data-no-drag
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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
          className="border-0 bg-transparent p-0 font-medium leading-tight text-canvas-ink outline-none ring-2 ring-canvas-ink/25"
          style={{
            fontSize: label.fontSize,
            width: `${inputWidthCh}ch`,
          }}
        />
      ) : (
        <div
          className={`whitespace-nowrap font-medium leading-tight text-canvas-ink ${
            isSelected
              ? "ring-2 ring-canvas-ink/25 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ fontSize: label.fontSize }}
        >
          {label.text}
        </div>
      )}
    </div>
  );
}
