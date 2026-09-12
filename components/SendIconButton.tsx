"use client";

function SendArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 10h8M11 7l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SendIconButton({
  disabled,
  onClick,
  className = "",
}: {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Send"
      className={`btn h-9 w-9 shrink-0 rounded-full bg-canvas-accent text-canvas-onAccent ${className}`}
    >
      <SendArrowIcon />
    </button>
  );
}

/** Non-interactive send icon for placement previews. */
export function SendIconPreview({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-canvas-accent/70 text-canvas-onAccent ${className}`}
    >
      <SendArrowIcon />
    </span>
  );
}
