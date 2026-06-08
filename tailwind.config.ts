import type { Config } from "tailwindcss";

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
          bg: "#FAFAF8",
          dot: "#8B8A86",
          card: "#FFFFFF",
          border: "#E6E4DF",
          ink: "#2C2A26",
          muted: "#8A867E",
          question: "#6B4EFF",
          accent: "#6B4EFF",
          artifactIconBg: "#EDE9FE",
          artifactStage: "#F3F2EF",
        },
      },
      borderRadius: {
        "artifact-card": "24px",
        "artifact-stage": "16px",
      },
      fontFamily: {
        sans: [
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
