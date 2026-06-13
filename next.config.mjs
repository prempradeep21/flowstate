import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Isolate showcase dev cache so it can run alongside `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Emit a self-contained server (.next/standalone/server.js + traced deps) so
  // the Electron Mac app can boot it with its bundled Node. See the Mac-app plan.
  output: "standalone",
  // Two package-lock.json files exist (repo root + worktree); pin tracing to
  // this directory so standalone file-tracing picks the correct root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
