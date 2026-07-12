import type { Metadata, Viewport } from "next";
import { Archivo, Figtree, Parkinsans } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import { THEME_NO_FLASH_SCRIPT } from "@/lib/design/theme/noFlashScript";
import { readPublishedTheme } from "@/lib/design/theme/publishedTheme.server";
import { resolveTheme } from "@/lib/design/theme/resolveTheme";
import { denton } from "@/lib/fonts/denton";
import { satoshi } from "@/lib/fonts/satoshi";
import "./globals.css";
import "./styles/artifact-styles.css";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side "published default" layer: a fresh browser (no personal
  // localStorage override yet) should see this instead of factory Flowstate,
  // with no flash. Cascade order gives the right precedence with zero client
  // logic: factory globals.css (lowest) -> this server-rendered <style>
  // (middle) -> the no-flash script's client-injected <style>, appended
  // last only when localStorage has a personal override (highest).
  const published = readPublishedTheme();
  const publishedCss =
    published.activeDefaultId != null
      ? resolveTheme(
          {
            presetId: published.activeDefaultId,
            mode: "light",
            overrides: published.defaultOverrides ?? {},
          },
          published.customThemes,
        ).css
      : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${parkinsans.variable} ${archivo.variable} ${denton.variable} ${satoshi.variable} h-full`}
    >
      <body className="h-full w-full overflow-hidden bg-canvas-bg font-sans text-canvas-ink antialiased">
        {publishedCss != null ? (
          <style
            id="flowstate-published-theme"
            dangerouslySetInnerHTML={{ __html: publishedCss }}
          />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }} />
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
