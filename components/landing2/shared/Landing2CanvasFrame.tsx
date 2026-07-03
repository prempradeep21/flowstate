"use client";

import dynamic from "next/dynamic";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { Landing2LazyMount } from "@/components/landing2/shared/Landing2LazyMount";

const LandingCanvasFrame = dynamic(
  () =>
    import("@/components/landing-page/shared/LandingCanvasFrame").then(
      (m) => m.LandingCanvasFrame,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse bg-canvas-card/40"
        style={{ height: "100%", minHeight: 480 }}
        aria-hidden
      />
    ),
  },
);

export function Landing2CanvasFrame({
  buildSnapshot,
  height = 480,
  className = "",
  label = "Flowstate canvas demo",
  fullBleed = false,
}: {
  buildSnapshot: () => CanvasSnapshot;
  height?: number;
  className?: string;
  label?: string;
  fullBleed?: boolean;
}) {
  const frameClass = fullBleed
    ? `h-full w-full overflow-hidden rounded-none border-0 shadow-none ${className}`
    : className;

  return (
    <Landing2LazyMount
      minHeight={fullBleed ? undefined : height}
      className={fullBleed ? "h-full w-full" : className}
    >
      <LandingCanvasFrame
        buildSnapshot={buildSnapshot}
        height={fullBleed ? undefined : height}
        className={frameClass}
        label={label}
      />
    </Landing2LazyMount>
  );
}
