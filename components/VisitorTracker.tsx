"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Fires a lightweight first-party page-view beacon on each route so the admin
 * Usage Analysis dashboard can report anonymous visitor volume, geography, and
 * source. All classification (geo, referrer → source, unique id) happens
 * server-side in /api/track; this just reports the path + referrer once per view.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Admin/dev/auth routes are internal — the server drops them too, but skip
    // the request entirely to avoid noise.
    if (/^\/(admin|dev|auth)(\/|$)/.test(pathname)) return;
    // Guard against duplicate fires from re-renders on the same path.
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Analytics is best-effort — never disrupt the app.
    });
  }, [pathname]);

  return null;
}
