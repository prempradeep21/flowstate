import type { Config } from "tailwindcss";
import {
  canvasColors,
  canvasFontSize,
  canvasRadii,
  concentricRadii,
} from "./lib/design/tokens";

/**
 * Every canvas color resolves through a CSS variable holding RGB channels,
 * so utilities flip with `html[data-theme="dark"]` while still supporting
 * Tailwind alpha modifiers (e.g. `bg-canvas-ink/70`).
 */
const canvasColorVars = Object.fromEntries(
  Object.keys(canvasColors).map((key) => {
    const cssVar = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    return [key, `rgb(var(--canvas-${cssVar}) / <alpha-value>)`];
  }),
) as Record<keyof typeof canvasColors, string>;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: canvasColorVars,
        brand: {
          DEFAULT: "rgb(var(--fs-brand) / <alpha-value>)",
          on: "rgb(var(--fs-on-brand) / <alpha-value>)",
        },
      },
      fontSize: {
        "canvas-micro": canvasFontSize.micro,
        "canvas-caption": canvasFontSize.caption,
        "canvas-compact": canvasFontSize.compact,
        "canvas-body-sm": canvasFontSize["body-sm"],
        "canvas-body": canvasFontSize.body,
        "canvas-body-lg": canvasFontSize["body-lg"],
        "canvas-heading": canvasFontSize.heading,
        "canvas-brand": canvasFontSize.brand,
        "canvas-display": canvasFontSize.display,
      },
      borderRadius: {
        canvas: canvasRadii.canvas,
        "canvas-lg": canvasRadii.lg,
        "canvas-md": canvasRadii.md,
        "canvas-sm": canvasRadii.sm,
        "canvas-xs": canvasRadii.xs,
        "canvas-inner": canvasRadii.inner,
        ...Object.fromEntries(
          Object.entries(concentricRadii).map(([key, value]) => [
            `canvas-${key}`,
            value,
          ]),
        ),
      },
      fontFamily: {
        sans: [
          "var(--font-figtree)",
          "var(--font-parkinsans)",
          "var(--font-archivo)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
          "emoji",
        ],
        display: [
          "var(--font-denton)",
          "Georgia",
          "Times New Roman",
          "serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
          "emoji",
        ],
      },
      // Cursor set (vars + SVGs defined in app/globals.css).
      cursor: {
        default: "var(--fs-cursor-default)",
        pointer: "var(--fs-cursor-pointer)",
        grab: "var(--fs-cursor-grab)",
        grabbing: "var(--fs-cursor-grabbing)",
        text: "var(--fs-cursor-text)",
        move: "var(--fs-cursor-move)",
        add: "var(--fs-cursor-add)",
        "not-allowed": "var(--fs-cursor-not-allowed)",
        wait: "var(--fs-cursor-progress)",
        progress: "var(--fs-cursor-progress)",
        "ew-resize": "var(--fs-cursor-ew-resize)",
        "ns-resize": "var(--fs-cursor-ns-resize)",
        "nwse-resize": "var(--fs-cursor-nwse-resize)",
        "nesw-resize": "var(--fs-cursor-nesw-resize)",
        "col-resize": "var(--fs-cursor-col-resize)",
        "row-resize": "var(--fs-cursor-row-resize)",
      },
      boxShadow: {
        // Chrome (panels, toolbar, popovers) is flat — card resolves to none.
        card: "var(--canvas-card-shadow)",
        cardHover: "var(--canvas-card-shadow-hover)",
        // Canvas-level elements (artifact windows, cards) keep elevation.
        artifact: "var(--canvas-artifact-shadow)",
        artifactHover: "var(--canvas-artifact-shadow-hover)",
      },
      transitionTimingFunction: {
        panel: "cubic-bezier(0.12, 0.84, 0.27, 1)",
        "motion-light": "cubic-bezier(0.22, 1, 0.36, 1)",
        "motion-medium": "cubic-bezier(0.16, 1, 0.3, 1)",
        "motion-heavy": "cubic-bezier(0.12, 0.84, 0.27, 1)",
        "motion-settle": "cubic-bezier(0.34, 1.25, 0.64, 1)",
      },
      transitionDuration: {
        panel: "380ms",
        "motion-instant": "100ms",
        "motion-fast": "200ms",
        "motion-standard": "320ms",
        "motion-slow": "480ms",
      },
    },
  },
  plugins: [],
};

export default config;

