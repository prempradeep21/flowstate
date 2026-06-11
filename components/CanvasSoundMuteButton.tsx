"use client";

import { SoundMuteIcon, SoundOnIcon } from "@/components/MenuIcons";
import { useClientMounted } from "@/hooks/useClientMounted";
import { useCanvasStore } from "@/lib/store";

export function CanvasSoundMuteButton() {
  const mounted = useClientMounted();
  const soundEnabled = useCanvasStore((s) => s.soundEnabled);
  const setSoundEnabled = useCanvasStore((s) => s.setSoundEnabled);

  if (!mounted) {
    return (
      <div
        className="pointer-events-none absolute bottom-5 left-5 z-30 h-9 w-9 rounded-canvas"
        aria-hidden
      />
    );
  }

  const muted = !soundEnabled;

  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!soundEnabled)}
      title={muted ? "Unmute UI sounds" : "Mute UI sounds"}
      aria-label={muted ? "Unmute UI sounds" : "Mute UI sounds"}
      aria-pressed={muted}
      className={`pointer-events-auto absolute bottom-5 left-5 z-30 flex h-9 w-9 items-center justify-center rounded-canvas border border-canvas-border bg-canvas-card/95 text-canvas-muted shadow-card backdrop-blur-sm transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
        muted ? "text-canvas-muted" : "text-canvas-ink"
      }`}
    >
      {muted ? <SoundMuteIcon /> : <SoundOnIcon />}
    </button>
  );
}
