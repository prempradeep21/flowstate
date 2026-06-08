"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ProceduralSvgBackground({ children, className = "" }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({
        w: Math.max(1, Math.round(width)),
        h: Math.max(1, Math.round(height)),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={shellRef}
      className={`pointer-events-none absolute inset-0 z-0 size-full ${className}`}
      aria-hidden
    >
      <svg
        className="block size-full"
        xmlns="http://www.w3.org/2000/svg"
        width={size.w || "100%"}
        height={size.h || "100%"}
        viewBox={size.w > 0 && size.h > 0 ? `0 0 ${size.w} ${size.h}` : undefined}
        preserveAspectRatio="none"
      >
        {children}
      </svg>
    </div>
  );
}
