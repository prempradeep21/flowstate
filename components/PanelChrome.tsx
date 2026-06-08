"use client";

export function PanelChevronIcon({
  direction,
  className = "h-5 w-5",
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function ArtifactsPanelIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <rect x="2" y="4" width="9" height="9" rx="1.5" />
      <path
        d="M6 2.5h7a1 1 0 0 1 1 1v7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 7.5h5M5 10h3" strokeLinecap="round" />
    </svg>
  );
}
