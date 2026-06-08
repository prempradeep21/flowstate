"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function SidebarTileMount({ children }: { children: ReactNode }) {
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
    <div ref={ref} className="h-full min-h-0 w-full">
      {visible ? (
        children
      ) : (
        <div className="h-full min-h-[80px] w-full bg-canvas-artifactStage/50" />
      )}
    </div>
  );
}
