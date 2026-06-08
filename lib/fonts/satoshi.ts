import localFont from "next/font/local";

/** Satoshi (local) — canvas font preview option. */
export const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/satoshi-regular-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/satoshi-medium-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/satoshi-bold-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
