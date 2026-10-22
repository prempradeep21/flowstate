"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SHOW_DELAY_MS = 350;
const GAP_PX = 8;
const EDGE_PX = 8;

const HINTABLE = 'button, a, [role="button"], [role="menuitem"], [role="tab"]';

interface Hint {
  text: string;
  rect: DOMRect;
  /** The control sits on the canvas (or a canvas menu): follow its style pack. */
  onCanvas: boolean;
}

const CANVAS_SCOPE = "[data-artifact-style], [data-canvas-portal]";

/**
 * Names an icon-only control in a small pill beside it on hover. Any button
 * whose visible text is empty gets its aria-label shown; `data-hint` overrides
 * the text, and `data-hint=""` opts a control out. Controls with a native
 * `title` keep the browser's tooltip instead. Mounted once at the app root.
 */
export function HoverHint() {
  const [hint, setHint] = useState<Hint | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Element | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    const hide = () => {
      clearTimer();
      targetRef.current = null;
      setHint(null);
    };

    const hintText = (el: Element): string | null => {
      const explicit = el.getAttribute("data-hint");
      if (explicit != null) return explicit.trim() || null;
      if (el.hasAttribute("title")) return null;
      const label = el.getAttribute("aria-label")?.trim();
      if (!label) return null;
      // innerText skips display:none spans, so a label hidden at this
      // breakpoint (e.g. "hidden sm:inline") still counts as icon-only.
      const visible = (el as HTMLElement).innerText?.trim();
      return visible ? null : label;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.(HINTABLE) ?? null;
      if (el === targetRef.current) return;
      hide();
      if (!el) return;
      const text = hintText(el);
      if (!text) return;
      targetRef.current = el;
      timerRef.current = window.setTimeout(() => {
        if (targetRef.current !== el || !el.isConnected) return;
        setHint({
          text,
          rect: el.getBoundingClientRect(),
          onCanvas: el.closest(CANVAS_SCOPE) != null,
        });
      }, SHOW_DELAY_MS);
    };

    const onOut = (e: PointerEvent) => {
      const el = targetRef.current;
      if (!el) return;
      const next = e.relatedTarget as Node | null;
      if (next && el.contains(next)) return;
      hide();
    };

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    document.addEventListener("wheel", hide, { capture: true, passive: true });
    window.addEventListener("blur", hide);
    return () => {
      clearTimer();
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      document.removeEventListener("wheel", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);

  // Place once the pill has a size: below the control, or above it when the
  // control sits in the lower half of the screen (the bottom toolbar).
  useEffect(() => {
    if (!hint) {
      setPos(null);
      return;
    }
    const pill = pillRef.current;
    if (!pill) return;
    const { width, height } = pill.getBoundingClientRect();
    const { rect } = hint;
    const above = rect.top + rect.height / 2 > window.innerHeight / 2;
    const top = above ? rect.top - GAP_PX - height : rect.bottom + GAP_PX;
    const centered = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(centered, EDGE_PX),
      window.innerWidth - width - EDGE_PX,
    );
    setPos({ left, top });
  }, [hint]);

  if (!hint) return null;

  return createPortal(
    <div
      ref={pillRef}
      role="tooltip"
      {...(hint.onCanvas ? { "data-canvas-portal": "", "data-canvas-hint": "" } : {})}
      className="pointer-events-none fixed z-[1000] whitespace-nowrap rounded-canvas-sm bg-canvas-ink px-2 py-1 text-canvas-caption font-medium text-canvas-card shadow-card transition-opacity duration-150"
      style={{
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        opacity: pos ? 1 : 0,
      }}
    >
      {hint.text}
    </div>,
    document.body,
  );
}
