export function SkillBrainIcon({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 6c-3.2 0-5.8 2.1-6.8 5.1-.9-.3-1.9-.4-2.9-.2-3.1.6-5.3 3.4-5.3 6.6 0 1.8.7 3.5 1.9 4.8-.5 1-.8 2.1-.8 3.2 0 3.9 3.1 7 7 7h1.5c.8 1.5 2.4 2.5 4.2 2.5h.6c2.5 0 4.6-1.7 5.2-4 .9-.2 1.7-.6 2.4-1.2 1.4-1.2 2.3-3 2.3-4.9 0-1.1-.3-2.2-.8-3.1 1.2-1.3 1.9-3 1.9-4.8 0-3.5-2.8-6.3-6.3-6.3-.8 0-1.5.1-2.2.4C25.4 7.7 22.9 6 20 6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 18c1.2 1.5 2.6 2.2 4 2.5M26 18c-1.2 1.5-2.6 2.2-4 2.5M17 24h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
