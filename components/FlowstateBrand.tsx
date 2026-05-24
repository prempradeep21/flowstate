"use client";

export function FlowstateBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${compact ? "justify-center" : ""}`}
    >
      <FlowstateLogo className={compact ? "h-[42px] w-[42px]" : "h-12 w-12"} />
      {!compact && (
        <div className="min-w-0">
          <div className="text-[22.5px] font-semibold leading-tight text-canvas-ink">
            <span className="font-display">Flowstate</span> Everywhere
          </div>
        </div>
      )}
    </div>
  );
}

function FlowstateLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-canvas-ink"
      />
      <path
        d="M8 22c4-8 8-12 16-14M8 10c3 4 8 8 16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-canvas-card"
      />
      <circle cx="24" cy="8" r="2" className="fill-canvas-accent" />
    </svg>
  );
}
