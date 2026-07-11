"use client";

export function NewCanvasCard({
  disabled,
  busy,
  onCreate,
}: {
  disabled: boolean;
  busy: boolean;
  onCreate: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCreate}
      className="group flex h-full w-full min-h-[13rem] flex-col items-center justify-center gap-2.5 rounded-canvas-lg border border-dashed border-canvas-border bg-canvas-card/50 text-canvas-muted transition-all duration-motion-standard ease-motion-medium hover:-translate-y-1 hover:border-canvas-accent/60 hover:bg-canvas-accent/5 hover:text-canvas-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {busy ? (
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent"
          aria-label="Creating canvas"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-muted shadow-card transition-all duration-motion-standard ease-motion-settle group-hover:rotate-90 group-hover:border-canvas-accent/40 group-hover:text-canvas-accent motion-reduce:transition-none">
          <PlusIcon />
        </span>
      )}
      <span className="text-canvas-body font-medium">New canvas</span>
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
