"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { presetEntries } from "seslen/presets";
import { playPreset } from "@/lib/sounds/engine";
import { PRESET_GROUPS } from "@/lib/sounds/presetGroups";
import type { SeslenPresetId, SoundPresetSelection } from "@/lib/sounds/types";

const NO_SOUND_LABEL = "No sound";

interface Props {
  value: SoundPresetSelection;
  onChange: (preset: SoundPresetSelection) => void;
  /** Gain applied when previewing presets (0..1). */
  previewGain?: number;
  className?: string;
}

function PlayButton({
  presetId,
  label,
  previewGain,
  onClick,
}: {
  presetId: SeslenPresetId;
  label: string;
  previewGain?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Preview ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        void playPreset(presetId, { force: true, gain: previewGain });
        onClick?.();
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-canvas-sm border border-canvas-border text-canvas-muted transition-colors hover:border-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
    >
      <span aria-hidden className="text-canvas-caption leading-none">
        ▶
      </span>
    </button>
  );
}

export function SoundPresetPicker({
  value,
  onChange,
  previewGain,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const isNone = value === null;
  const selected = value ? presetEntries[value] : null;

  const showNoSoundOption = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      NO_SOUND_LABEL.toLowerCase().includes(q) ||
      q.includes("silent") ||
      q.includes("mute") ||
      q.includes("none") ||
      q === "off"
    );
  }, [filter]);

  const filteredGroups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return PRESET_GROUPS;
    return PRESET_GROUPS.map((group) => ({
      ...group,
      presets: group.presets.filter((id) => {
        const entry = presetEntries[id];
        if (!entry) return false;
        return (
          id.includes(q) ||
          entry.label.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.tags.some((tag) => tag.includes(q))
        );
      }),
    })).filter((group) => group.presets.length > 0);
  }, [filter]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!rootRef.current?.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", handlePointerDown);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, handlePointerDown]);

  const hasListItems = showNoSoundOption || filteredGroups.length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-canvas border border-canvas-border bg-canvas-card px-2.5 py-2 text-left transition-colors hover:border-canvas-muted"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="min-w-0">
            <span className="block truncate text-canvas-compact font-medium text-canvas-ink">
              {isNone ? NO_SOUND_LABEL : (selected?.label ?? value)}
            </span>
            <span className="block truncate text-canvas-micro text-canvas-muted">
              {isNone
                ? "This interaction will be silent"
                : selected
                  ? `${selected.description}${selected.durationMs != null ? ` · ${selected.durationMs}ms` : ""}`
                  : ""}
            </span>
          </span>
          <span className="shrink-0 text-canvas-muted" aria-hidden>
            ▾
          </span>
        </button>
        {!isNone && value && (
          <PlayButton
            presetId={value}
            label={selected?.label ?? value}
            previewGain={previewGain}
          />
        )}
        {isNone && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-canvas-sm border border-dashed border-canvas-border text-canvas-micro text-canvas-muted"
            aria-hidden
          >
            —
          </span>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Sound presets"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
        >
          <div className="border-b border-canvas-border p-2">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter presets…"
              className="w-full rounded-canvas-sm border border-canvas-border bg-canvas-bg px-2 py-1.5 text-canvas-compact text-canvas-ink outline-none focus:border-canvas-ink"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {showNoSoundOption && (
              <div className="mb-1">
                <div className="px-2 py-1 text-canvas-micro font-semibold uppercase tracking-wide text-canvas-muted">
                  Off
                </div>
                <div
                  role="option"
                  aria-selected={isNone}
                  className={`flex items-center gap-2 rounded-canvas-sm px-1 py-1 ${
                    isNone ? "bg-canvas-bg" : "hover:bg-canvas-bg/70"
                  }`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-canvas-sm border border-dashed border-canvas-border text-canvas-micro text-canvas-muted"
                    aria-hidden
                  >
                    —
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-canvas-compact font-medium text-canvas-ink">
                      {NO_SOUND_LABEL}
                    </span>
                    <span className="block truncate text-canvas-micro text-canvas-muted">
                      Skip audio for this interaction
                    </span>
                  </button>
                </div>
              </div>
            )}
            {filteredGroups.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="px-2 py-1 text-canvas-micro font-semibold uppercase tracking-wide text-canvas-muted">
                  {group.label}
                </div>
                {group.presets.map((presetId) => {
                  const entry = presetEntries[presetId];
                  if (!entry) return null;
                  const isSelected = presetId === value;
                  return (
                    <div
                      key={presetId}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex items-center gap-2 rounded-canvas-sm px-1 py-1 ${
                        isSelected ? "bg-canvas-bg" : "hover:bg-canvas-bg/70"
                      }`}
                    >
                      <PlayButton
                        presetId={presetId}
                        label={entry.label}
                        previewGain={previewGain}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onChange(presetId);
                          setOpen(false);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-canvas-compact font-medium text-canvas-ink">
                          {entry.label}
                        </span>
                        <span className="block truncate text-canvas-micro text-canvas-muted">
                          {entry.recipe}
                          {entry.durationMs != null ? ` · ${entry.durationMs}ms` : ""}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            {!hasListItems && (
              <p className="px-2 py-3 text-canvas-compact text-canvas-muted">
                No presets match your filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
