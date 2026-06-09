"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export const CANVAS_FLOATING_MENU_Z = "z-[50000]";

export function useCanvasFloatingMenuPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  placement: "bottom-end" | "top-end" = "bottom-end",
  gap = 4,
) {
  const portalRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{
    left: number;
    top: number;
    transform?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (placement === "bottom-end") {
        setStyle({
          left: rect.right,
          top: rect.bottom + gap,
          transform: "translateX(-100%)",
        });
      } else {
        setStyle({
          left: rect.right,
          top: rect.top - gap,
          transform: "translateX(-100%) translateY(-100%)",
        });
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, placement, gap]);

  return { portalRef, style };
}

export function CanvasFloatingMenuPortal({
  open,
  style,
  portalRef,
  children,
  className = "",
}: {
  open: boolean;
  style: { left: number; top: number; transform?: string } | null;
  portalRef: RefObject<HTMLDivElement>;
  children: ReactNode;
  className?: string;
}) {
  if (!open || !style || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={portalRef}
      className={`fixed ${CANVAS_FLOATING_MENU_Z} ${className}`}
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
