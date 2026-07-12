import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isDesignSystemExport = process.env.DESIGN_SYSTEM_EXPORT === "1";
// Set by `dist:mac` before `next build` so only the Electron packaging build
// gets standalone output — normal dev/Vercel builds are unaffected.
const isDesktopBuild = process.env.NEXT_PUBLIC_IS_DESKTOP === "true";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Isolate showcase dev cache so it can run alongside `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@cursor/sdk", "sqlite3"],
  // Two package-lock.json files exist (repo root + worktree); pin tracing to
  // this directory so standalone file-tracing (desktop build) picks the
  // correct root.
  outputFileTracingRoot: __dirname,
  // Serve the static landing page at a clean /landing URL (no /index.html)
  // by rewriting internally instead of redirecting the browser.
  async rewrites() {
    return [
      {
        source: "/landing",
        destination: "/landing/index.html",
      },
      {
        source: "/landing/how-it-works",
        destination: "/landing/how-it-works.html",
      },
    ];
  },
  ...(isDesignSystemExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : isDesktopBuild
      ? {
          // Emit a self-contained server (.next/standalone/server.js + traced
          // deps) so the Electron Mac app can boot it with its bundled Node.
          output: "standalone",
        }
      : {}),
};

export default nextConfig;
