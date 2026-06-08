"use client";

import { useAuth } from "@/components/AuthProvider";

export function LocalReadOnlyBanner() {
  const { localReadOnly } = useAuth();

  if (!localReadOnly) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto fixed bottom-3 left-3 z-[90] w-[min(42rem,calc(100vw-1.5rem))] rounded-canvas border border-canvas-accent/30 bg-canvas-accent/10 px-3 py-2 shadow-card"
    >
      <p className="text-canvas-body-sm font-medium text-canvas-ink">
        Local session
      </p>
      <p className="text-canvas-compact leading-snug text-canvas-muted">
        Loaded from production Supabase. You can edit freely — new branches,
        questions, and canvases — but nothing is saved. Reload restores
        production data.
      </p>
    </div>
  );
}
