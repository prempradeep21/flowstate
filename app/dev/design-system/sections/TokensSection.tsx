"use client";

import {
  canvasColors,
  canvasRadii,
  canvasSpacing,
  darkCanvasColors,
  THREAD_ACCENT_PALETTE,
} from "@/lib/design/tokens";

const CORE_COLOR_KEYS = [
  "bg",
  "card",
  "border",
  "ink",
  "muted",
  "accent",
  "artifactStage",
  "connector",
] as const;

const TYPOGRAPHY_SAMPLES: { name: string; className: string; size: string }[] = [
  { name: "micro", className: "text-canvas-micro", size: "10px" },
  { name: "caption", className: "text-canvas-caption", size: "11px" },
  { name: "compact", className: "text-canvas-compact", size: "12px" },
  { name: "body-sm", className: "text-canvas-body-sm", size: "13px" },
  { name: "body", className: "text-canvas-body", size: "14px" },
  { name: "body-lg", className: "text-canvas-body-lg", size: "15px" },
  { name: "heading", className: "text-canvas-heading", size: "18px" },
  { name: "brand", className: "text-canvas-brand", size: "22.5px" },
  { name: "display", className: "text-canvas-display", size: "52px" },
];

function Swatch({ name, light, dark }: { name: string; light: string; dark: string }) {
  return (
    <div className="rounded-canvas border border-canvas-border bg-canvas-card p-3">
      <div className="flex gap-2">
        <div
          className="h-10 flex-1 rounded-canvas-sm border border-canvas-border/60"
          style={{ backgroundColor: light }}
          title={`Light: ${light}`}
        />
        <div
          className="h-10 flex-1 rounded-canvas-sm border border-canvas-border/60"
          style={{ backgroundColor: dark }}
          title={`Dark: ${dark}`}
        />
      </div>
      <p className="mt-2 font-mono text-canvas-compact text-canvas-ink">{name}</p>
      <p className="text-canvas-micro text-canvas-muted">{light}</p>
    </div>
  );
}

export function TokensSection() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="font-display text-xl text-canvas-ink">Core colors</h2>
        <p className="mt-2 max-w-2xl text-canvas-body-sm text-canvas-muted">
          Left swatch is light theme, right is dark. Source:{" "}
          <code className="text-canvas-ink">lib/design/tokens.ts</code>
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_COLOR_KEYS.map((key) => (
            <Swatch
              key={key}
              name={`canvas-${key}`}
              light={canvasColors[key]}
              dark={darkCanvasColors[key]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-canvas-ink">Thread accent palette</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {THREAD_ACCENT_PALETTE.map((color, i) => (
            <div key={color} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-full border border-canvas-border"
                style={{ backgroundColor: color }}
              />
              <span className="text-canvas-micro text-canvas-muted">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-canvas-ink">Typography</h2>
        <div className="mt-4 flex flex-col gap-4 rounded-canvas border border-canvas-border bg-canvas-card p-5">
          {TYPOGRAPHY_SAMPLES.map(({ name, className, size }) => (
            <div key={name} className="border-b border-canvas-border/60 pb-3 last:border-0 last:pb-0">
              <p className={`${className} text-canvas-ink`}>
                text-canvas-{name} — The quick brown fox
              </p>
              <p className="mt-1 font-mono text-canvas-micro text-canvas-muted">{size}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-canvas-ink">Radii & spacing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4">
            <h3 className="text-canvas-body-sm font-medium text-canvas-ink">Corner radii</h3>
            <ul className="mt-3 space-y-2 text-canvas-body-sm text-canvas-muted">
              {Object.entries(canvasRadii).map(([key, value]) => (
                <li key={key}>
                  <code className="text-canvas-ink">
                    rounded-canvas{key === "canvas" ? "" : `-${key}`}
                  </code>{" "}
                  — {value}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4">
            <h3 className="text-canvas-body-sm font-medium text-canvas-ink">Spacing scale</h3>
            <ul className="mt-3 space-y-2 text-canvas-body-sm text-canvas-muted">
              <li>
                <code className="text-canvas-ink">compact</code> — {canvasSpacing.compact}px
              </li>
              <li>
                <code className="text-canvas-ink">section</code> — {canvasSpacing.section}px
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
