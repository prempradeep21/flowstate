"use client";

import { useAuth } from "@/components/AuthProvider";

export function SaveStatusBadge() {
  const { user, supabaseConfigured, persistenceStatus, saveStatus } = useAuth();

  if (!supabaseConfigured) {
    return null;
  }

  if (persistenceStatus === "loading") {
    return (
      <div className="pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted">
        Loading canvas…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted">
        Sign in to save
      </div>
    );
  }

  if (saveStatus === "saving") {
    return (
      <div className="pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted">
        Saving…
      </div>
    );
  }

  if (saveStatus === "error") {
    return (
      <div className="pointer-events-auto rounded-full border border-red-400/40 bg-canvas-surface/90 px-3 py-1.5 text-xs text-red-400">
        Save failed
      </div>
    );
  }

  return (
    <div className="pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 text-xs text-canvas-muted">
      Saved to cloud
    </div>
  );
}
