import type { CSSProperties } from "react";
import {
  DEFAULT_BODY_FONT_ID,
  DEFAULT_DISPLAY_FONT_ID,
  getBodyFontOption,
  getDisplayFontOption,
} from "@/lib/canvasFonts/registry";

export function getCanvasFontPreviewStyles(
  bodyId: string,
  displayId: string,
): CSSProperties | undefined {
  const style: Record<string, string> = {};

  if (bodyId !== DEFAULT_BODY_FONT_ID) {
    const body = getBodyFontOption(bodyId);
    if (body) {
      // Override the token for any font-sans descendants…
      style["--font-parkinsans"] = body.family;
      // …and set font-family on the container so inherited text updates
      // (body already resolved Parkinsans before this node).
      style.fontFamily = body.family;
    }
  }

  if (displayId !== DEFAULT_DISPLAY_FONT_ID) {
    const display = getDisplayFontOption(displayId);
    if (display) style["--font-denton"] = display.family;
  }

  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

export function getDisplayFontPreviewStyles(
  displayId: string,
): CSSProperties | undefined {
  if (displayId === DEFAULT_DISPLAY_FONT_ID) return undefined;
  const display = getDisplayFontOption(displayId);
  if (!display) return undefined;
  return { "--font-denton": display.family } as CSSProperties;
}
