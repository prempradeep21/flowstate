"use client";

import { useCallback, useEffect, useState } from "react";

export type HomeTheme = "light" | "dark";

const STORAGE_KEY = "flowstate:home-theme";

/**
 * Home-view theme, independent of the per-canvas theme. Defaults to light and
 * persists across visits. Applied via the .theme-scope-light/.theme-scope-dark
 * classes so it flips the design tokens for the Home subtree only.
 */
export function useHomeTheme(): { theme: HomeTheme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<HomeTheme>("light");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") setTheme(stored);
    } catch {
      // Storage unavailable — keep the light default.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
