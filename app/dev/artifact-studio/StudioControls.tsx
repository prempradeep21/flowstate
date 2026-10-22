"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: ReactNode; hint?: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-canvas-border bg-canvas-card p-1"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-canvas-body-sm font-medium transition-colors ${
              active
                ? "bg-canvas-ink text-canvas-card"
                : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Global "which artifact kinds are in the studio" dropdown — a checklist of
 * every kind the pool has, with counts. Unchecked kinds drop out of every
 * view, including Randomize.
 */
export function KindFilter<T extends string>({
  kinds,
  hidden,
  onChange,
}: {
  kinds: { id: T; label: string; count: number }[];
  hidden: Set<T>;
  onChange: (hidden: Set<T>) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = kinds.filter((k) => !hidden.has(k.id)).length;
  const toggle = (id: T) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:border-canvas-accent/40"
      >
        Artifacts
        <span className="tabular-nums text-canvas-muted">
          {shown === kinds.length ? "All" : `${shown}/${kinds.length}`}
        </span>
        <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[100] mt-2 w-64 overflow-hidden rounded-2xl border border-canvas-border bg-canvas-card shadow-[0_12px_32px_rgb(0_0_0/0.14)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-canvas-border px-4 py-2.5">
            <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Show kinds <span className="font-normal tabular-nums">· {shown}</span>
            </p>
            <div className="flex gap-3 text-canvas-micro font-medium">
              <button type="button" onClick={() => onChange(new Set())} disabled={hidden.size === 0} className="text-canvas-ink hover:text-canvas-accent disabled:opacity-35">
                All
              </button>
              <button type="button" onClick={() => onChange(new Set(kinds.map((k) => k.id)))} disabled={shown === 0} className="text-canvas-ink hover:text-canvas-accent disabled:opacity-35">
                None
              </button>
            </div>
          </div>
          <ul className="max-h-[min(60vh,480px)] overflow-y-auto p-1.5">
            {kinds.map((k) => {
              const on = !hidden.has(k.id);
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(k.id)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-canvas-body-sm hover:bg-canvas-bg"
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
                        on ? "border-canvas-ink bg-canvas-ink text-canvas-card" : "border-canvas-border bg-canvas-card"
                      }`}
                    >
                      {on ? (
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="m2.5 6.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={`flex-1 ${on ? "text-canvas-ink" : "text-canvas-muted"}`}>{k.label}</span>
                    <span className="tabular-nums text-canvas-micro text-canvas-muted">{k.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Light / dark for the artifacts and the board they sit on — never for the
 * studio's own chrome, which stays as it is so the cards are always judged
 * against the same controls.
 */
export function ModeToggle({ mode, onChange }: { mode: "light" | "dark"; onChange: (mode: "light" | "dark") => void }) {
  const dark = mode === "dark";
  return (
    <button
      type="button"
      onClick={() => onChange(dark ? "light" : "dark")}
      aria-pressed={dark}
      aria-label={dark ? "Show the light themes" : "Show the dark themes"}
      title={dark ? "Light themes (D)" : "Dark themes (D)"}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-canvas-border bg-canvas-card px-3 text-canvas-body-sm font-medium text-canvas-ink hover:border-canvas-accent/40"
    >
      {dark ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M13.5 9.6A5.5 5.5 0 0 1 6.4 2.5a5.5 5.5 0 1 0 7.1 7.1Z" strokeLinejoin="round" />
        </svg>
      )}
      {dark ? "Dark" : "Light"}
    </button>
  );
}
