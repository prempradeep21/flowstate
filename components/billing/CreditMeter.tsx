"use client";

import { useEffect, useState } from "react";
import type { CreditSnapshot } from "@/lib/billing/types";

interface MeResponse {
  signedIn: boolean;
  snapshot: CreditSnapshot | null;
  enforcement?: "off" | "shadow" | "on";
}

/**
 * Credit balance, shown in the left-panel footer under the auth chip.
 *
 * Renders NOTHING unless enforcement is switched on for this deployment. While
 * Phase 1/2 are gathering data there is no limit to speak of, and showing a
 * meter for a limit that does not bite would be misleading.
 */
export function CreditMeter() {
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/billing/me");
        if (!res.ok) return;
        const json = (await res.json()) as MeResponse;
        if (!cancelled) setData(json);
      } catch {
        // the meter is cosmetic — never surface an error for it
      }
    };

    void load();
    // Refresh when the tab regains focus, so an upgrade made elsewhere shows up.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!data || data.enforcement === "off" || !data.enforcement) return null;
  if (!data.signedIn || !data.snapshot) return null;

  const { used, limit, remaining, periodEnd } = data.snapshot;
  if (limit <= 0) return null;

  const pct = Math.min(100, (used / limit) * 100);
  const tone =
    pct >= 95
      ? "text-canvas-danger"
      : pct >= 80
        ? "text-canvas-warning"
        : "text-canvas-muted";
  const barTone =
    pct >= 95
      ? "bg-canvas-danger"
      : pct >= 80
        ? "bg-canvas-warning"
        : "bg-canvas-accent";

  const resets = new Date(periodEnd).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col gap-1 px-1"
      title={`${Math.round(remaining).toLocaleString()} credits left — resets ${resets}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-canvas-micro tabular-nums ${tone}`}>
          {Math.round(remaining).toLocaleString()} credits left
        </span>
        <span className="text-canvas-micro text-canvas-muted">{resets}</span>
      </div>
      <div className="h-0.5 w-full overflow-hidden rounded-canvas-xs bg-canvas-border">
        <div
          className={`h-full rounded-canvas-xs ${barTone}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}
