import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Delta",
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
    <html lang="en" className={`${archivo.variable} h-full`}>
      <body className="h-full w-full overflow-hidden bg-canvas-bg font-sans text-canvas-ink antialiased">
        {children}
      </body>
    </html>
  );
}
