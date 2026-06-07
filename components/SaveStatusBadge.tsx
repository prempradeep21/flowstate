"use client";

import { useAuth } from "@/components/AuthProvider";

type SaveStatusBadgeSize = "default" | "panel";

export function SaveStatusBadge({
  size = "default",
}: {
  size?: SaveStatusBadgeSize;
}) {
  const textSize = size === "panel" ? "text-[18px]" : "text-xs";
  const badgeClass = `pointer-events-auto rounded-full border border-canvas-border/60 bg-canvas-surface/90 px-3 py-1.5 ${textSize}`;
  const { user, supabaseConfigured, persistenceStatus, saveStatus } = useAuth();

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

  if (saveStatus === "saving") {
    return (
      <div className={`${badgeClass} text-canvas-muted`}>Saving…</div>
    );
  }

  if (saveStatus === "error") {
    return (
      <div
        className={`pointer-events-auto rounded-full border border-red-400/40 bg-canvas-surface/90 px-3 py-1.5 ${textSize} text-red-400`}
      >
        Save failed
      </div>
    );
  }

  return null;
}
