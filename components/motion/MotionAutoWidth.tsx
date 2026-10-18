"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Chrome row whose width eases to fit its content instead of snapping when
 * controls come and go (panelExpand: CSS width, standard / easeMedium). The
 * content is measured, so callers keep plain flex children. Content is
 * right-anchored: the unit sits on the right edge, so it grows leftward and
 * new controls emerge from the left as the shell widens.
 *
 * Clips only while the width moves, so popovers and focus rings are never cut
 * at rest. Keep popovers outside this wrapper all the same.
 */
export function MotionAutoWidth({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const innerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const next = el.offsetWidth;
      const prev = widthRef.current;
      if (prev != null && Math.abs(prev - next) < 0.5) return;
      if (prev != null && !reducedMotion) setMoving(true);
      widthRef.current = next;
      setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      className={`flex justify-end transition-[width] duration-motion-standard ease-motion-medium motion-reduce:transition-none ${className}`}
      style={{
        width: width ?? undefined,
        overflow: moving ? "hidden" : undefined,
      }}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "width") {
          setMoving(false);
        }
      }}
    >
      <div ref={innerRef} className="flex w-max shrink-0 items-center gap-1">
        {children}
      </div>
    </div>
  );
}
