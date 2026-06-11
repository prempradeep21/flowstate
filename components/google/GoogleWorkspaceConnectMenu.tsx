"use client";

import { useState } from "react";
import { useGoogleConnection } from "@/hooks/useGoogleConnection";

export function GoogleWorkspaceConnectMenu({
  size = "default",
}: {
  size?: "default" | "panel";
}) {
  const { signedIn, connected, email, loading, connect, disconnect } =
    useGoogleConnection();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const textSize =
    size === "panel" ? "floating-chrome-chip" : "text-canvas-compact";

  if (!signedIn || loading) return null;

  const label = connected
    ? email?.split("@")[0] ?? "Drive connected"
    : "Connect Drive";

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (connected) {
            setOpen((o) => !o);
            return;
          }
          connect();
        }}
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition disabled:opacity-50 ${
          connected
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
            : "border-canvas-border/60 bg-canvas-card/90 text-canvas-ink hover:border-canvas-accent/40"
        } ${textSize}`}
        title={
          connected
            ? "Google Drive connected — only files you choose are accessed"
            : "Connect Google Drive to import Docs and Sheets you select"
        }
      >
        <GoogleDriveDot connected={connected} />
        {label}
      </button>
      {open && connected && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[998]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-[999] mt-1 min-w-[220px] rounded-canvas border border-canvas-border bg-canvas-card p-2 shadow-card">
            <p className="px-2 py-1 text-canvas-micro text-canvas-muted">
              Only files you pick are accessed. Flowstate never scans your entire
              Drive.
            </p>
            <p className="truncate px-2 pb-2 text-canvas-compact text-canvas-ink">
              {email}
            </p>
            <button
              type="button"
              disabled={busy}
              className="block w-full rounded-canvas px-2 py-1.5 text-left text-canvas-body-sm text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink disabled:opacity-50"
              onClick={async () => {
                setBusy(true);
                try {
                  await disconnect();
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Disconnect Google Drive
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GoogleDriveDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        connected ? "bg-emerald-500" : "bg-canvas-muted/50"
      }`}
      aria-hidden
    />
  );
}
