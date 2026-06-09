"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const VIEWPORT_EDGE_PAD = 8;

/** Horizontally centers a popover above an anchor button within a positioned container. */
export function useToolbarPopoverAnchor(
  anchorRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  popoverRef?: RefObject<HTMLElement | null>,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ left: "50%" });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      const container = containerRef.current;
      if (!anchor || !container) return;

      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const anchorCenterViewportX = anchorRect.left + anchorRect.width / 2;

      let centerX = anchorCenterViewportX - containerRect.left;

      const popover = popoverRef?.current;
      if (popover) {
        const halfW = popover.offsetWidth / 2;
        const clampedViewportX = Math.min(
          window.innerWidth - VIEWPORT_EDGE_PAD - halfW,
          Math.max(VIEWPORT_EDGE_PAD + halfW, anchorCenterViewportX),
        );
        centerX = clampedViewportX - containerRect.left;
      }

      setStyle({ left: centerX });
    };

    update();

    const popover = popoverRef?.current;
    const ro =
      popover && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    ro?.observe(popover!);

    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, containerRef, popoverRef]);

  return style;
}
