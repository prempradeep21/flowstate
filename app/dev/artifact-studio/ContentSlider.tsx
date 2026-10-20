"use client";

import type { ArtifactPayload } from "@/lib/artifactTypes";
import { ORIGINAL_AMOUNT, countOf } from "@/lib/artifactStudio/contentVariants";

/**
 * Floating control at the foot of the focus stage: drag from the least an
 * artifact can hold to packed, with the authored content parked in the middle.
 */
export function ContentSlider({
  original,
  varied,
  amount,
  onAmountChange,
  onRandomize,
}: {
  original: ArtifactPayload;
  varied: ArtifactPayload;
  amount: number;
  onAmountChange: (amount: number) => void;
  onRandomize: () => void;
}) {
  const now = countOf(varied);
  const was = countOf(original);
  const atOriginal = Math.abs(amount - ORIGINAL_AMOUNT) < 0.001;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[560px] items-center gap-3 rounded-full border border-canvas-border bg-canvas-card/95 py-2 pl-5 pr-2 shadow-lg backdrop-blur">
        <span className="shrink-0 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">Content</span>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={amount}
            onChange={(e) => onAmountChange(Number(e.target.value))}
            onDoubleClick={() => onAmountChange(ORIGINAL_AMOUNT)}
            aria-label="Content amount"
            aria-valuetext={now ? `${now.n} ${now.unit}` : undefined}
            className="w-full accent-canvas-accent"
            list="studio-content-ticks"
          />
          <datalist id="studio-content-ticks">
            <option value={ORIGINAL_AMOUNT} />
          </datalist>
          <div className="flex justify-between text-[10px] leading-none text-canvas-muted">
            <span>Sparse</span>
            <button
              type="button"
              onClick={() => onAmountChange(ORIGINAL_AMOUNT)}
              className={`hover:text-canvas-ink ${atOriginal ? "font-semibold text-canvas-ink" : ""}`}
              title="Back to the authored content (0)"
            >
              Original
            </button>
            <span>Packed</span>
          </div>
        </div>
        <span
          className="w-[92px] shrink-0 text-right text-canvas-body-sm tabular-nums text-canvas-ink"
          title={was ? `Originally ${was.n} ${was.unit}` : undefined}
        >
          {now ? `${now.n} ${now.unit}` : ""}
        </span>
        <button
          type="button"
          onClick={onRandomize}
          title="Random amount and mix (R)"
          aria-label="Randomize content"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-canvas-border bg-canvas-bg text-canvas-ink transition-colors hover:border-canvas-accent/40"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="2" y="2" width="12" height="12" rx="3" />
            <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="10.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
