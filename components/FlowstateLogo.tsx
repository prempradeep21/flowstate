"use client";

import { useId } from "react";

/**
 * The Flowstate brand mark. A single source of truth for the logo so every
 * surface (app chrome, home, landing, legal) stays in sync. Colors are baked
 * into the mark (cobalt field, white knot) rather than theme tokens, so it
 * reads consistently in light and dark.
 *
 * clipPath ids are salted with a per-instance `useId()` so multiple logos on
 * the same page don't collide.
 */
export function FlowstateLogo({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const c0 = `fs-clip0-${uid}`;
  const c1 = `fs-clip1-${uid}`;

  return (
    <svg
      viewBox="0 0 146 146"
      className={className}
      role="img"
      aria-label="Flowstate"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath={`url(#${c0})`}>
        <g clipPath={`url(#${c1})`}>
          <rect
            x="-30.1572"
            y="73.1562"
            width="145.886"
            height="145.886"
            rx="72.9432"
            transform="rotate(-45 -30.1572 73.1562)"
            fill="#1754C6"
          />
          <path
            d="M-18.7098 148.049C-7.86879 137.208 9.23958 120.1 19.1545 110.185C35.0474 94.2922 16.4405 75.6487 40.2324 54.7245"
            stroke="white"
            strokeWidth="5"
          />
          <path
            d="M-1.89125 164.863C8.9498 154.022 26.0581 136.914 35.973 126.999C51.866 111.106 70.5095 129.713 91.4337 105.921"
            stroke="white"
            strokeWidth="5"
          />
          <path d="M-5.10498 151.262L87.3438 58.813" stroke="white" strokeWidth="5" />
          <circle
            cx="9.93979"
            cy="9.93979"
            r="9.93979"
            transform="matrix(0.685142 -0.728409 -0.728409 -0.685142 43.3479 65.5977)"
            fill="white"
          />
          <circle
            cx="94.608"
            cy="103.239"
            r="9.93979"
            transform="rotate(-43.2468 94.608 103.239)"
            fill="white"
          />
          <circle
            cx="9.93979"
            cy="9.93979"
            r="9.93979"
            transform="matrix(0.685142 -0.728409 -0.728409 -0.685142 94.1492 66.4883)"
            fill="white"
          />
        </g>
      </g>
      <defs>
        <clipPath id={c0}>
          <rect width="146" height="146" fill="white" />
        </clipPath>
        <clipPath id={c1}>
          <rect
            x="-30.1572"
            y="73.1562"
            width="145.886"
            height="145.886"
            rx="72.9432"
            transform="rotate(-45 -30.1572 73.1562)"
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
