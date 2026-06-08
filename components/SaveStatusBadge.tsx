"use client";

import { useAuth } from "@/components/AuthProvider";

type SaveStatusBadgeSize = "default" | "panel";

export function SaveStatusBadge({
  size = "default",
}: {
  size?: SaveStatusBadgeSize;
}) {
  const textSize =
    size === "panel" ? "floating-chrome-chip" : "text-canvas-compact";
  const badgeClass = `pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-card/90 px-2.5 py-1 ${textSize}`;
  const { user, supabaseConfigured, persistenceStatus, saveStatus, localReadOnly } =
    useAuth();

  if (!supabaseConfigured) {
    return (
      <div className={`${badgeClass} text-canvas-muted`}>Cloud save off</div>
    );
  }

  if (persistenceStatus === "loading") {
    return (
      <div className={`${badgeClass} text-canvas-muted`}>Loading canvas…</div>
    );
  }

  if (!user) {
    return (
      <div className={`${badgeClass} text-canvas-muted`}>Sign in to save</div>
    );
  }

  if (localReadOnly) {
    return (
      <div className={`${badgeClass} text-canvas-muted`} title="Changes reset on reload">
        Local session
      </div>
    );
  }

  if (saveStatus === "saving") {
    return (
      <div className={`${badgeClass} text-canvas-muted`}>Saving…</div>
    );
  }

  if (saveStatus === "error") {
    return (
      <div
        className={`pointer-events-auto rounded-full border border-canvas-danger/40 bg-canvas-card/90 px-2.5 py-1 ${textSize} text-canvas-danger`}
      >
        Save failed
      </div>
    );
  }

  return null;
}
