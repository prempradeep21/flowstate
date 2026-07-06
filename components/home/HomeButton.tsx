"use client";

/** Compact inline "back to home" control used inside the left panel chrome. */
export function HomeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to home"
      title="Back to home"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
    >
      <HomeIcon />
    </button>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
