"use client";

import { CanvasSoundMuteButton } from "@/components/CanvasSoundMuteButton";

/** Fixed sound toggle — same control as the canvas app. */
export function LandingSoundControl() {
  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[60] [&_button]:relative [&_button]:bottom-auto [&_button]:left-auto">
      <CanvasSoundMuteButton />
    </div>
  );
}
