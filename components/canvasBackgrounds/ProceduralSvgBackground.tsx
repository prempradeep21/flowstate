"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ProceduralSvgBackground({ children, className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 size-full overflow-hidden ${className}`}
      aria-hidden
    >
      <svg
        className="block h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        {children}
      </svg>
    </div>
  );
}
