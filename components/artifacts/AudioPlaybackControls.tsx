"use client";

export const AUDIO_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type AudioPlaybackRate = (typeof AUDIO_PLAYBACK_RATES)[number];

export function formatPlaybackRate(rate: number): string {
  return rate % 1 === 0 ? `${rate}×` : `${rate}×`;
}

export function AudioPlaybackControls({
  rate,
  onRateChange,
  disabled = false,
}: {
  rate: AudioPlaybackRate;
  onRateChange: (rate: AudioPlaybackRate) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      data-no-drag
    >
      <label className="flex items-center gap-1.5 text-canvas-caption font-medium text-canvas-muted">
        <span>Speed</span>
        <select
          value={rate}
          disabled={disabled}
          onChange={(e) =>
            onRateChange(Number(e.target.value) as AudioPlaybackRate)
          }
          className="h-6 rounded-canvas-md border border-canvas-border bg-canvas-card px-2 text-canvas-caption tabular-nums text-canvas-ink outline-none transition-colors focus-visible:border-canvas-accent/50 focus-visible:ring-1 focus-visible:ring-canvas-accent/30 disabled:opacity-40"
          data-no-drag
        >
          {AUDIO_PLAYBACK_RATES.map((option) => (
            <option key={option} value={option}>
              {formatPlaybackRate(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
