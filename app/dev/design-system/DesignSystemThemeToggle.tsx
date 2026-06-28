"use client";

import { useEffect, useState } from "react";

export function DesignSystemThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      className="rounded-full border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-compact text-canvas-muted transition-colors hover:text-canvas-ink"
      aria-pressed={theme === "dark"}
    >
      {theme === "light" ? "Dark theme" : "Light theme"}
    </button>
  );
}
