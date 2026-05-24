import localFont from "next/font/local";

/** Denton (local) — used for the canvas landing headline. */
export const denton = localFont({
  src: [
    {
      path: "../../public/fonts/denton/denton-thin-100.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-light-300.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-regular-400.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-medium-500.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-bold-700.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-extrabold-800.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/denton/denton-black-900.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-denton",
  display: "swap",
});
