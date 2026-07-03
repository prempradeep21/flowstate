"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Landing2LazyMount({
  children,
  rootMargin = "100% 0px",
  minHeight,
  className = "",
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number;
  className?: string;
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
      { root: document.getElementById("landing2-scroll-root"), rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={minHeight && !visible ? { minHeight } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}
