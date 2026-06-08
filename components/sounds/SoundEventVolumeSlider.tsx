"use client";

import { clampEventVolume } from "@/lib/sounds/config";

interface Props {
  value: number;
  onChange: (volume: number) => void;
  disabled?: boolean;
  className?: string;
}

export function SoundEventVolumeSlider({
  value,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  return (
    <label
      className={`flex items-center gap-2 ${disabled ? "opacity-40" : ""} ${className}`}
    >
      <span className="shrink-0 text-canvas-micro text-canvas-muted">Level</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clampEventVolume(Number(e.target.value)))}
        className="min-w-0 flex-1 disabled:cursor-not-allowed"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Sound level"
      />
      <span className="w-8 shrink-0 text-right text-canvas-micro tabular-nums text-canvas-ink">
        {Math.round(value * 100)}
      </span>
    </label>
  );
}
