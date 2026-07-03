"use client";

import dynamic from "next/dynamic";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { Landing2Nav } from "@/components/landing2/Landing2Nav";
import { Landing2ScrollProvider } from "@/components/landing2/Landing2ScrollProvider";
import { LandingSoundControl } from "@/components/landing-page/shared/LandingSoundControl";

const Landing2ProgressRail = dynamic(
  () =>
    import("@/components/landing2/Landing2ProgressRail").then(
      (m) => m.Landing2ProgressRail,
    ),
  { ssr: false },
);

const Landing2Story = dynamic(
  () =>
    import("@/components/landing2/Landing2Story").then((m) => m.Landing2Story),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />
        <p className="relative z-10 font-display text-canvas-heading text-canvas-muted">
          Loading story…
        </p>
      </div>
    ),
  },
);

export function Landing2App() {
  return (
    <Landing2ScrollProvider>
      <div className="font-sans text-canvas-ink">
        <Landing2Nav />
        <Landing2Story />
        <Landing2ProgressRail />
        <LandingSoundControl />
      </div>
    </Landing2ScrollProvider>
  );
}
