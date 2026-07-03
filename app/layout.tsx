import type { Metadata, Viewport } from "next";
import { Archivo, Figtree, Parkinsans } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import { denton } from "@/lib/fonts/denton";
import { satoshi } from "@/lib/fonts/satoshi";
import "./globals.css";

const parkinsans = Parkinsans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-parkinsans",
});

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Flowstate",
  description: "A spatial thinking canvas for AI-assisted inquiry.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${parkinsans.variable} ${archivo.variable} ${denton.variable} ${satoshi.variable} h-full`}
    >
      <body className="h-full w-full overflow-hidden bg-canvas-bg font-sans text-canvas-ink antialiased">
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
