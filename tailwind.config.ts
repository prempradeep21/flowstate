import type { Config } from "tailwindcss";
import {
  canvasColors,
  canvasFontSize,
  canvasRadii,
} from "./lib/design/tokens";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: canvasColors.bg,
          dot: canvasColors.dot,
          card: canvasColors.card,
          border: canvasColors.border,
          ink: canvasColors.ink,
          muted: canvasColors.muted,
          accent: canvasColors.accent,
          artifactIconBg: canvasColors.artifactIconBg,
          artifactStage: canvasColors.artifactStage,
          connector: canvasColors.connector,
          plugFill: canvasColors.plugFill,
          stageDark: canvasColors.stageDark,
          codeBg: canvasColors.codeBg,
          syntaxComment: canvasColors.syntaxComment,
          syntaxString: canvasColors.syntaxString,
          syntaxKeyword: canvasColors.syntaxKeyword,
          danger: canvasColors.danger,
          dangerSoft: canvasColors.dangerSoft,
          dangerBorder: canvasColors.dangerBorder,
          success: canvasColors.success,
          successText: canvasColors.successText,
          successSoft: canvasColors.successSoft,
          successRing: canvasColors.successRing,
          warning: canvasColors.warning,
          warningSoft: canvasColors.warningSoft,
          warningRing: canvasColors.warningRing,
          warningText: canvasColors.warningText,
          info: canvasColors.info,
          infoText: canvasColors.infoText,
          infoSoft: canvasColors.infoSoft,
          infoRing: canvasColors.infoRing,
          tagDanger: canvasColors.tagDanger,
          tagDangerSoft: canvasColors.tagDangerSoft,
          tagDangerRing: canvasColors.tagDangerRing,
          mapPrimary: canvasColors.mapPrimary,
          mapSaved: canvasColors.mapSaved,
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
        "canvas-sm": canvasRadii.sm,
        "canvas-xs": canvasRadii.xs,
      },
      fontFamily: {
        sans: [
          "var(--font-parkinsans)",
          "var(--font-archivo)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        display: [
          "var(--font-denton)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 18, 14, 0.04), 0 4px 16px rgba(20, 18, 14, 0.06)",
        cardHover:
          "0 1px 2px rgba(20, 18, 14, 0.05), 0 8px 24px rgba(20, 18, 14, 0.10)",
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
