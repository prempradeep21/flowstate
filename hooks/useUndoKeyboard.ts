"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/lib/store";

function isEditableWithContent(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return (target as HTMLInputElement | HTMLTextAreaElement).value.length > 0;
  }
  return target.isContentEditable;
}

/** Global Ctrl/Cmd+Z undo; skips when typing in a non-empty field. */
export function useUndoKeyboard() {
  const undo = useCanvasStore((s) => s.undo);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key !== "z" || (!e.ctrlKey && !e.metaKey) || e.shiftKey || e.altKey)
        return;
      if (isEditableWithContent(e.target)) return;
      if (useCanvasStore.getState().undoPast.length === 0) return;

      e.preventDefault();
      undo();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [undo]);
}
