"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { HugContext } from "@/components/artifactStyles/hug";

export { HugContext, useHugs } from "@/components/artifactStyles/hug";

/**
 * Lays an artifact out at (roughly) the size it was designed for on the canvas
 * and scales the result into whatever box it is given — the same trick the
 * canvas itself uses, so type and spacing stay true to the design at any tile
 * size.
 *
 *   natural — canvas size × STUDIO_ARTIFACT_SCALE; shrinks further only if the box is smaller
 *   tile — fill the box; design width ≈ natural, never below `minScale`
 *   fit  — natural aspect, as large as fits (the "maximum size" view)
 *   fill — same zoom as fit, but reflowed to fill the whole box
 *   actual — 1:1 pixels, centered, scrolls if larger than the box
 *
 * `hug` lays the artifact out at its natural width but lets its height follow
 * its content (natural/fit/actual only — tile and fill dictate the height), so
 * a kind whose height depends on what it holds is never clipped by its box.
 * Its value is the least height the artifact is drawn at (0 = pure content);
 * null keeps the fixed box. The stage is a flex column, so a frame that
 * takes `flex-1` fills out to that least height.
 */
export type StageMode = "natural" | "tile" | "fit" | "fill" | "actual";

/** "Canvas size" in the studio is drawn at this fraction of true canvas pixels. */
export const STUDIO_ARTIFACT_SCALE = 0.5;

function useBoxSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev && Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5
          ? prev
          : { w: width, h: height },
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function ScaledStage({
  natural: designed,
  mode,
  minScale = 0.6,
  maxScale = 2.5,
  hug = null,
  onHugHeight,
  lockScale = null,
  offset,
  onOffsetSettle,
  children,
}: {
  natural: { w: number; h: number };
  mode: StageMode;
  minScale?: number;
  maxScale?: number;
  hug?: number | null;
  /** Called with the content's own height (design px) whenever it changes. */
  onHugHeight?: (h: number) => void;
  /**
   * Holds the zoom while a corner resize is in flight — the canvas never
   * rescales under a grip, and a stage re-fitting mid-drag would feed back
   * on the very size it is drawing.
   */
  lockScale?: number | null;
  /** Shift from the centred spot, in design px (scaled with the artifact). */
  offset?: { x: number; y: number };
  /**
   * Out of a gesture the offset is held to the stage — a re-fit after a
   * resize would otherwise carry the artifact off it — and the held value is
   * handed back so the next gesture starts from what is drawn.
   */
  onOffsetSettle?: (offset: { x: number; y: number }) => void;
  children: ReactNode;
}) {
  const [ref, box] = useBoxSize<HTMLDivElement>();
  const hugging = hug != null && (mode === "natural" || mode === "fit" || mode === "actual");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [huggedH, setHuggedH] = useState<number | null>(null);
  const onHugHeightRef = useRef(onHugHeight);
  onHugHeightRef.current = onHugHeight;
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!hugging || !el) return;
    // offsetHeight is the layout height, untouched by the scale transform.
    const measure = () => {
      const h = Math.ceil(el.offsetHeight);
      if (h <= 0) return;
      setHuggedH((prev) => (prev === h ? prev : h));
      onHugHeightRef.current?.(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hugging, box !== null]);
  const natural = hugging && huggedH ? { w: designed.w, h: huggedH } : designed;

  let layout: { w: number; h: number; scale: number } | null = null;
  if (box && box.w > 0 && box.h > 0) {
    if (mode === "natural") {
      layout = { w: natural.w, h: natural.h, scale: Math.min(STUDIO_ARTIFACT_SCALE, box.w / natural.w, box.h / natural.h) };
    } else if (mode === "tile") {
      const designW = Math.min(Math.max(natural.w, box.w), box.w / minScale);
      const scale = box.w / designW;
      layout = { w: designW, h: box.h / scale, scale };
    } else if (mode === "actual") {
      layout = { w: natural.w, h: natural.h, scale: 1 };
    } else {
      const fit = Math.min(maxScale, box.w / natural.w, box.h / natural.h);
      layout =
        mode === "fit"
          ? { w: natural.w, h: natural.h, scale: fit }
          : { w: box.w / fit, h: box.h / fit, scale: fit };
    }
  }

  if (layout && lockScale != null && mode !== "tile" && mode !== "fill") layout = { ...layout, scale: lockScale };

  const scaledW = layout ? layout.w * layout.scale : 0;
  const scaledH = layout ? layout.h * layout.scale : 0;
  const scrolls = mode === "actual" && box && (scaledW > box.w || scaledH > box.h);

  let left = 0;
  let top = 0;
  let settled = offset;
  if (layout && box) {
    const place = (room: number, size: number, shift: number) => {
      const centred = Math.max(0, (room - size) / 2);
      const at = centred + shift * layout!.scale;
      // Mid-gesture the anchored corner must not move, so nothing is held then.
      return lockScale == null && size <= room ? Math.min(Math.max(at, 0), room - size) : at;
    };
    left = place(box.w, scaledW, offset?.x ?? 0);
    top = place(box.h, scaledH, offset?.y ?? 0);
    if (offset) {
      settled = {
        x: (left - Math.max(0, (box.w - scaledW) / 2)) / layout.scale,
        y: (top - Math.max(0, (box.h - scaledH) / 2)) / layout.scale,
      };
    }
  }
  const onOffsetSettleRef = useRef(onOffsetSettle);
  onOffsetSettleRef.current = onOffsetSettle;
  useEffect(() => {
    if (!offset || !settled) return;
    if (Math.abs(settled.x - offset.x) > 0.5 || Math.abs(settled.y - offset.y) > 0.5) onOffsetSettleRef.current?.(settled);
  }, [offset, settled?.x, settled?.y]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      className={`relative h-full w-full ${scrolls ? "overflow-auto" : mode === "fill" ? "overflow-hidden" : "overflow-visible"}`}
    >
      {layout && box ? (
        <div
          ref={contentRef}
          className="absolute"
          style={{
            left,
            top,
            width: layout.w,
            height: hugging ? undefined : layout.h,
            ...(hugging ? { minHeight: hug!, display: "flex", flexDirection: "column" as const } : {}),
            transform: layout.scale === 1 ? undefined : `scale(${layout.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <HugContext.Provider value={hugging}>{children}</HugContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

/** Mounts children the first time they scroll near the viewport, then keeps them. */
export function LazyMount({
  children,
  placeholder,
}: {
  children: ReactNode;
  placeholder?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return (
    <div ref={ref} className="h-full w-full">
      {visible ? children : placeholder}
    </div>
  );
}
