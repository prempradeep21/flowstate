"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ProceduralSvgBackground({ children, className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {children}
      </svg>
    </div>
  );
}
