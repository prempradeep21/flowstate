/** @type {import('next').NextConfig} */
const isDesignSystemExport = process.env.DESIGN_SYSTEM_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Isolate showcase dev cache so it can run alongside `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@cursor/sdk", "sqlite3"],
  ...(isDesignSystemExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
