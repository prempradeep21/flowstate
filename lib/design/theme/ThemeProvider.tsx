"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/design/theme/themeStore";

/**
 * Hydrates the persisted theme into the store on first mount. The boot
 * script in app/layout.tsx already injected the persisted stylesheet before
 * paint, so there is no flash; from here on the store is the single writer
 * (every store action re-resolves, re-injects, and re-persists).
 *
 * Note: this provider deliberately does NOT touch html[data-theme] — the
 * per-canvas ThemeApplier owns that attribute on canvas pages.
 */
export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
