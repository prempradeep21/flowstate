import type { CanvasBackgroundStyle } from "@/lib/store";

export type { CanvasBackgroundStyle };

export interface BackgroundRenderProps {
  viewport?: { x: number; y: number; scale: number };
  /** When false, skip animations (preview tiles, reduced motion). */
  animate?: boolean;
  className?: string;
}

export interface BackgroundOption {
  id: CanvasBackgroundStyle;
  label: string;
  description: string;
}
