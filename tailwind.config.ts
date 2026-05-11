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
          dot: "#D9D7D2",
          card: "#FFFFFF",
          border: "#E6E4DF",
          ink: "#2C2A26",
          muted: "#8A867E",
        },
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
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 18, 14, 0.04), 0 4px 16px rgba(20, 18, 14, 0.06)",
        cardHover:
          "0 1px 2px rgba(20, 18, 14, 0.05), 0 8px 24px rgba(20, 18, 14, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
