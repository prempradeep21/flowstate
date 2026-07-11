"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Single icon primitive — all product iconography comes from lucide-react
 * rendered through this wrapper so size and stroke weight stay consistent.
 *
 * Purpose-based sizes:
 * - inline:  14px — icons inside text lines, chips, captions
 * - control: 16px — menu rows, small buttons, inputs (default)
 * - toolbar: 20px — toolbar and panel-header controls
 * - hero:    24px — artifact header circles, empty states
 */
export type IconSize = "inline" | "control" | "toolbar" | "hero";

export const ICON_SIZE_PX: Record<IconSize, number> = {
  inline: 14,
  control: 16,
  toolbar: 20,
  hero: 24,
};

export const ICON_STROKE_WIDTH = 1.5;

export function Icon({
  icon: IconComponent,
  size = "control",
  className = "",
  strokeWidth = ICON_STROKE_WIDTH,
}: {
  icon: LucideIcon;
  size?: IconSize;
  /** Tailwind height/width classes here override the purpose size. */
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <IconComponent
      aria-hidden
      size={ICON_SIZE_PX[size]}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
    />
  );
}
