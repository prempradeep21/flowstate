"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSelectionInContainer } from "@/lib/answerTextRange";
import { useCanvasStore } from "@/lib/store";

const DISMISS_IGNORE =
  "[data-answer-selection-menu], [data-quick-explain-popup], [data-explain-overlay]";

export interface AnswerSelectionState {
  selectedText: string;
  occurrenceIndex: number;
  rect: DOMRect;
}

function shouldIgnoreDismiss(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest(DISMISS_IGNORE));
}

export function useAnswerTextSelection({
  containerRef,
  enabled,
  onDismiss,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  onDismiss?: () => void;
}) {
  const [selection, setSelection] = useState<AnswerSelectionState | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const viewport = useCanvasStore((s) => s.viewport);

  useEffect(() => {
    setSelection(null);
  }, [viewport.x, viewport.y, viewport.scale]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) sel.removeAllRanges();
  }, []);

  const readSelection = useCallback(() => {
    const container = containerRef.current;
    if (!container || !enabled) {
      setSelection(null);
      return;
    }
    const result = getSelectionInContainer(container);
    setSelection(result);
  }, [containerRef, enabled]);

  useEffect(() => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const onMouseUp = (e: MouseEvent) => {
      if (!container.contains(e.target as Node)) return;
      requestAnimationFrame(readSelection);
    };

    // Bubble phase + pointerup so menu button clicks complete before dismiss.
    const onPointerUp = (e: PointerEvent) => {
      if (shouldIgnoreDismiss(e.target)) return;
      if (!container.contains(e.target as Node)) {
        setSelection(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
    };

    container.addEventListener("mouseup", onMouseUp);
    document.addEventListener("pointerup", onPointerUp, false);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("pointerup", onPointerUp, false);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, containerRef, readSelection, clearSelection]);

  return {
    selection,
    clearSelection,
    dismissMenu: () => {
      setSelection(null);
      dismissRef.current?.();
    },
  };
}
