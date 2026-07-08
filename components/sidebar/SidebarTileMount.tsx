"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function SidebarTileMount({
  children,
  fixedHeight,
}: {
  children: ReactNode;
  fixedHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {visible ? (
        children
      ) : (
        <div
          className="h-full w-full bg-canvas-artifactStage/50"
          style={fixedHeight != null ? { height: fixedHeight } : undefined}
        />
      )}
    </div>
  );
}
