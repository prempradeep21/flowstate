export function LandingQIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-canvas border border-current font-sans text-canvas-caption font-semibold leading-none ${className}`}
      aria-hidden
    >
      Q
    </span>
  );
}

export function LandingZoomIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M10.2 10.2L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M7 5v4M5 7h4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingAssetsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <rect
        x="2.5"
        y="4.5"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M5 7.5h2M5 9.5h3.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <rect
        x="6.5"
        y="2.5"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M9 5.5h2.5M9 7.5h3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingCollaboratorsIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <circle cx="5.75" cy="5.25" r="1.75" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M2.5 12.25c0-1.75 1.45-2.75 3.25-2.75s3.25 1 3.25 2.75"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="10.75" cy="5.75" r="1.75" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M8 12.75c.35-1.55 1.55-2.5 3.25-2.5 1.05 0 1.95.45 2.55 1.25"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
