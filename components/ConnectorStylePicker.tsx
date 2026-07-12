"use client";

import type { ReactNode } from "react";
import type { ConnectorStyle } from "@/lib/store";

function CurvyIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d="M2.5 11.5C2.5 6.5 5 3.5 8 3.5s5.5 3 5.5 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path
        d="M3 4.5h4.5V8H12.5V11.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Floating curvy/orthogonal toggle shown at a hovered connection's midpoint.
 * `scale` inverse-scales when positioned in world space (legacy SVG layer);
 * pass 1 for screen-space positioning (canvas connections layer).
 */
export function ConnectorStylePicker({
  x,
  y,
  scale,
  activeStyle,
  onSelect,
  onHoverChange,
}: {
  x: number;
  y: number;
  scale: number;
  activeStyle: ConnectorStyle;
  onSelect: (style: ConnectorStyle) => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const options: { style: ConnectorStyle; label: string; icon: ReactNode }[] = [
    { style: "curvy", label: "Curved connectors", icon: <CurvyIcon /> },
    {
      style: "orthogonal",
      label: "Pipeline connectors",
      icon: <PipelineIcon />,
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Connector style"
      className="pointer-events-auto absolute z-20 flex items-center gap-0.5 rounded-canvas border border-canvas-border bg-canvas-card p-0.5 shadow-artifact"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, calc(-100% - 10px)) scale(${1 / scale})`,
        transformOrigin: "bottom center",
      }}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      {options.map(({ style, label, icon }) => {
        const active = activeStyle === style;
        return (
          <button
            key={style}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onSelect(style)}
            className={`flex h-8 w-8 items-center justify-center rounded-canvas transition-colors ${
              active
                ? "bg-canvas-accentSoft text-canvas-accent"
                : "text-canvas-muted hover:bg-canvas-ink/5 hover:text-canvas-ink"
            }`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
