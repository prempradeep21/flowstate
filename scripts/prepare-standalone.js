// Next.js `output: "standalone"` traces the server + node_modules into
// .next/standalone, but it does NOT copy the static assets or /public.
// electron-builder bundles .next/standalone as-is, so we stitch them in here.
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function requireDir(dir, hint) {
  if (!fs.existsSync(dir)) {
    console.error(`Missing ${dir}. ${hint}`);
    process.exit(1);
  }
}

requireDir(standalone, "Run `next build` (with output: 'standalone') first.");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));

console.log("✓ Stitched .next/static and public into .next/standalone");
