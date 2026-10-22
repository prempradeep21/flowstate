"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  FONT_OPTIONS,
  fontOf,
  previewFamilyFonts,
  setFamilyFonts,
  useSavedFamilyFonts,
  type ArtifactStyleFamily,
  type FontId,
  type FontSlot,
} from "@/components/artifactStyles";

function Chevron({ dir }: { dir: "left" | "right" | "down" }) {
  const d = dir === "left" ? "M10 3 5 8l5 5" : dir === "right" ? "M6 3l5 5-5 5" : "M4 6l4 4 4-4";
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GROUPS = ["Sans", "Serif", "Mono"] as const;
/** Menu order — grouped, so ‹ › and ↑ ↓ walk the list as it reads. */
const ORDERED = GROUPS.flatMap((g) => FONT_OPTIONS.filter((f) => f.group === g));

/**
 * One font slot of a family: ‹ [dropdown] ›. Hovering (or arrowing through) a
 * menu option previews it on the artifact; clicking commits. ‹ › step through
 * the same list and commit straight away.
 */
export function FontPicker({
  label,
  value,
  defaultId,
  onPreview,
  onCommit,
}: {
  label: string;
  value: FontId;
  defaultId: FontId;
  onPreview: (id: FontId | null) => void;
  onCommit: (id: FontId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const index = Math.max(0, ORDERED.findIndex((f) => f.id === value));

  const close = () => {
    setOpen(false);
    onPreview(null);
  };
  const commit = (id: FontId) => {
    onPreview(null);
    onCommit(id);
    setOpen(false);
  };
  const step = (delta: number) => commit(ORDERED[(index + delta + ORDERED.length) % ORDERED.length]!.id);

  useEffect(() => {
    if (!open) return;
    setActive(index);
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the keyboard-active option in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // The focus view listens on window for ← → / Esc; keep those keys here.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        step(e.key === "ArrowLeft" ? -1 : 1);
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + ORDERED.length) % ORDERED.length;
      setActive(next);
      onPreview(ORDERED[next]!.id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commit(ORDERED[active]!.id);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.stopPropagation();
    }
  };

  const current = fontOf(value);

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <div className="inline-flex items-center rounded-full border border-canvas-border bg-canvas-card p-1">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Previous ${label.toLowerCase()} font`}
          title="Previous font"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex h-7 w-[196px] items-center gap-2 rounded-full px-2.5 text-left hover:bg-canvas-bg"
        >
          <span className="shrink-0 text-canvas-micro uppercase tracking-wider text-canvas-muted">{label}</span>
          <span className="min-w-0 flex-1 truncate text-[14px] text-canvas-ink" style={{ fontFamily: current.stack }}>
            {current.name}
          </span>
          <span className="shrink-0 text-canvas-muted">
            <Chevron dir="down" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Next ${label.toLowerCase()} font`}
          title="Next font"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <Chevron dir="right" />
        </button>
      </div>

      {open ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label={`${label} font`}
          onMouseLeave={() => onPreview(null)}
          className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[min(440px,70vh)] w-[260px] overflow-y-auto rounded-[18px] border border-canvas-border bg-canvas-card p-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.3)]"
        >
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="px-3 pb-1 pt-2 text-canvas-micro uppercase tracking-wider text-canvas-muted">{group}</p>
              {ORDERED.map((f, i) =>
                f.group !== group ? null : (
                  <button
                    key={f.id}
                    type="button"
                    role="option"
                    data-i={i}
                    aria-selected={f.id === value}
                    onMouseEnter={() => {
                      setActive(i);
                      onPreview(f.id);
                    }}
                    onClick={() => commit(f.id)}
                    className={`flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left ${i === active ? "bg-canvas-bg" : ""}`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[17px] leading-tight text-canvas-ink" style={{ fontFamily: f.stack }}>
                      {f.name}
                    </span>
                    {f.id === defaultId ? <span className="shrink-0 text-canvas-micro text-canvas-muted">default</span> : null}
                    {f.id === value ? (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-canvas-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A style family's two fonts — Primary and Secondary — side by side. Changes
 * belong to the family, so they show on every artifact drawn in it.
 */
export function StyleFontPickers({ family }: { family: ArtifactStyleFamily }) {
  const saved = useSavedFamilyFonts(family);
  const changed = saved.primary !== family.fonts.primary || saved.secondary !== family.fonts.secondary;

  // Never leave an audition behind when the family changes or the toolbar goes.
  useEffect(() => () => previewFamilyFonts(family.id, null), [family.id]);

  const commit = (slot: FontSlot, id: FontId) => {
    const next = { ...saved, [slot]: id };
    const isDefault = next.primary === family.fonts.primary && next.secondary === family.fonts.secondary;
    setFamilyFonts(family.id, isDefault ? null : next);
  };

  return (
    <div className="flex items-center gap-2">
      {(["primary", "secondary"] as const).map((slot) => (
        <FontPicker
          key={`${family.id}:${slot}`}
          label={slot === "primary" ? "Primary" : "Secondary"}
          value={saved[slot]}
          defaultId={family.fonts[slot]}
          onPreview={(id) => previewFamilyFonts(family.id, id ? { ...saved, [slot]: id } : null)}
          onCommit={(id) => commit(slot, id)}
        />
      ))}
      {changed ? (
        <button
          type="button"
          onClick={() => setFamilyFonts(family.id, null)}
          title={`Back to ${family.name}'s default fonts`}
          className="text-canvas-micro font-medium text-canvas-muted underline-offset-2 hover:text-canvas-ink hover:underline"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
