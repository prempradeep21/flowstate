"use client";

import { useAuth } from "@/components/AuthProvider";

const LOCAL_SESSION_TITLE =
  "Loaded from production Supabase. You can edit freely, but nothing is saved. Reload restores production data.";

export function LocalSessionTag() {
  const { localReadOnly } = useAuth();

  if (!localReadOnly) return null;

  return (
    <div
      role="status"
      title={LOCAL_SESSION_TITLE}
      className="shrink-0 rounded-canvas border border-canvas-accent/30 bg-canvas-accent/10 shadow-card"
    >
      <span className="floating-chrome-padding block text-canvas-compact font-medium text-canvas-muted">
        Local session
      </span>
    </div>
  );
}
