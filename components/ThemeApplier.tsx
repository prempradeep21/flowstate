"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/lib/store";

/**
 * Applies the active canvas's theme to the document root.
 * Theme is per-canvas; the default is dark. Light theme removes the attribute
 * to keep :root the canonical light source.
 */
export function ThemeApplier() {
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (canvasTheme === "dark") {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }
    return () => {
      delete root.dataset.theme;
    };
  }, [canvasTheme]);

  return null;
}
