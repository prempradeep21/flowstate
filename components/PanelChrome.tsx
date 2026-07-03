"use client";

import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { ICON_STROKE_WIDTH } from "@/components/ui/Icon";

export function PanelChevronIcon({
  direction,
  className = "h-5 w-5",
}: {
  direction: "left" | "right";
  className?: string;
}) {
  const Chevron = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <Chevron aria-hidden className={className} strokeWidth={ICON_STROKE_WIDTH} />
  );
}

export function ArtifactsPanelIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Layers aria-hidden className={className} strokeWidth={ICON_STROKE_WIDTH} />
  );
}
