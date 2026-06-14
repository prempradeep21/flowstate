"use client";

export function AssetKindIcon({
  kind,
  className = "h-7 w-7",
}: {
  kind: "document" | "code" | "spreadsheet" | "word" | "presentation";
  className?: string;
}) {
  if (kind === "code") {
    return (
      <svg
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden
        className={className}
      >
        <path
          d="M11 9 6 14l5 5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 9l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m15 7-2 14"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "spreadsheet") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden className={className}>
        <rect
          x="6"
          y="5"
          width="16"
          height="18"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M6 11h16M6 16h16M11 11v12M16 11v12"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (kind === "presentation") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden className={className}>
        <rect
          x="5"
          y="7"
          width="18"
          height="12"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M9 21h10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "word") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden className={className}>
        <path
          d="M8 4.5h8l4 4V23a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 8 23V4.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M16 4.5v4h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M10 14h8M10 18h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden className={className}>
      <path
        d="M8 4.5h8l4 4V23a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 8 23V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.5v4h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M11 14h6M11 18h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
