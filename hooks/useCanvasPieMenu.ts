"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  angleToSector,
  clampPieCenter,
  PIE_SECTORS,
  type PieSectorId,
} from "@/lib/canvasPieMenu";
import type { PieMenuState } from "@/components/CanvasPieMenu";

const SECTOR_ENABLED = Object.fromEntries(
  PIE_SECTORS.map((s) => [s.id, s.enabled]),
) as Record<PieSectorId, boolean>;

interface UseCanvasPieMenuOptions {
  containerRef: RefObject<HTMLElement | null>;
  /** False on read-only canvases — Z is inert (both actions are mutations). */
  enabled: boolean;
  /** True while another interaction owns the cursor (placements, plug drag, marquee, pan). */
  isBlocked: () => boolean;
  /** Latest pointer position in client coords; null falls back to container center. */
  getCursor: () => { x: number; y: number } | null;
  onSelect: (sector: PieSectorId) => void;
}

/**
 * Hold-Z pie menu controller. Pure gesture mode: the menu lives only while
 * Z is held; keyup fires the armed sector (or nothing) and always closes.
 *
 * Esc and Q/T/S accelerators are handled by the Canvas key handlers via
 * `pieStateRef` + `closePie` so event ordering against the existing
 * capture-phase listeners stays deterministic.
 */
export function useCanvasPieMenu({
  containerRef,
  enabled,
  isBlocked,
  getCursor,
  onSelect,
}: UseCanvasPieMenuOptions) {
  const [pieState, setPieState] = useState<PieMenuState | null>(null);
  const pieStateRef = useRef<PieMenuState | null>(null);

  // Keep the ref in sync synchronously so capture-phase handlers never read stale state.
  const setPie = useCallback((next: PieMenuState | null) => {
    pieStateRef.current = next;
    setPieState(next);
  }, []);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const isBlockedRef = useRef(isBlocked);
  isBlockedRef.current = isBlocked;
  const getCursorRef = useRef(getCursor);
  getCursorRef.current = getCursor;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Z keydown — capture phase so the pie works even when an empty question
  // field is focused (same allowance as the Q shortcut).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyZ" || e.repeat) return;
      // Bare Z only — Ctrl+Z/Cmd+Z (undo) and other chords pass through untouched.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (pieStateRef.current) return;
      if (!enabledRef.current) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") {
          const field = target as HTMLInputElement | HTMLTextAreaElement;
          if (field.value.trim().length > 0) return;
        } else if (target.isContentEditable) {
          return;
        }
      }

      if (isBlockedRef.current()) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cursor = getCursorRef.current();
      const rawX = cursor?.x ?? rect.left + rect.width / 2;
      const rawY = cursor?.y ?? rect.top + rect.height / 2;
      const center = clampPieCenter(
        Math.min(rect.right, Math.max(rect.left, rawX)),
        Math.min(rect.bottom, Math.max(rect.top, rawY)),
        rect,
      );

      e.preventDefault();
      e.stopPropagation();
      target?.blur();
      setPie({ centerX: center.x, centerY: center.y, activeSector: null });
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [containerRef, setPie]);

  // While open: track pointer angle, resolve on Z keyup, tear down on blur
  // (keyup never arrives after Alt-Tab / window switch).
  const open = pieState !== null;
  useEffect(() => {
    if (!open) return;

    const onPointerMove = (e: PointerEvent) => {
      const st = pieStateRef.current;
      if (!st) return;
      const sector = angleToSector(
        e.clientX - st.centerX,
        e.clientY - st.centerY,
      );
      const armed = sector && SECTOR_ENABLED[sector] ? sector : null;
      if (armed !== st.activeSector) {
        setPie({ ...st, activeSector: armed });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyZ") return;
      const st = pieStateRef.current;
      if (!st) return;
      e.preventDefault();
      const armed = st.activeSector;
      setPie(null);
      if (armed) onSelectRef.current(armed);
    };

    const onBlur = () => setPie(null);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [open, setPie]);

  const closePie = useCallback(() => setPie(null), [setPie]);

  return { pieState, pieStateRef, closePie };
}
