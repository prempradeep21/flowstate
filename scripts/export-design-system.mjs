import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_SITE = path.join(ROOT, "dist", "design-system", "site");
const EXPORT_DIR = path.join(ROOT, ".next-design-system-export");
const STASH_ROOT = path.join(ROOT, ".design-system-export-stash");
const STASH_TARGETS = [
  path.join("app", "api"),
  path.join("app", "auth"),
  path.join("app", "canvas", "join"),
];

function stashExportIncompatibleRoutes() {
  fs.mkdirSync(STASH_ROOT, { recursive: true });
  let stashed = false;
  for (const rel of STASH_TARGETS) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(STASH_ROOT, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
    stashed = true;
  }
  return stashed;
}

function restoreExportIncompatibleRoutes(stashed) {
  if (!stashed) return;
  for (const rel of STASH_TARGETS) {
    const dest = path.join(ROOT, rel);
    const src = path.join(STASH_ROOT, rel);
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
  }
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeRedirectIndex() {
  const indexPath = path.join(OUT_SITE, "index.html");
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/dev/design-system/" />
    <title>Flowstate Design System</title>
  </head>
  <body>
    <p><a href="/dev/design-system/">Open Flowstate Design System</a></p>
  </body>
</html>
`;
  fs.writeFileSync(indexPath, redirectHtml, "utf8");
}

function cleanStaleNextTypes() {
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(".next")) continue;
    const typesDir = path.join(ROOT, entry.name, "types");
    if (fs.existsSync(typesDir)) {
      fs.rmSync(typesDir, { recursive: true, force: true });
    }
  }
}

console.log("\n→ Exporting design token bundle…\n");
run("node", ["scripts/export-design-tokens.mjs"]);

console.log("\n→ Building static design system site…\n");
cleanStaleNextTypes();
const stashed = stashExportIncompatibleRoutes();
try {
  run("npx", ["next", "build"], {
    DESIGN_SYSTEM_EXPORT: "1",
    NEXT_DIST_DIR: ".next-design-system-export",
  });
} finally {
  restoreExportIncompatibleRoutes(stashed);
}

if (!fs.existsSync(EXPORT_DIR)) {
  console.error(
    `Expected Next.js export output at ${EXPORT_DIR} — build may have failed.`,
  );
  process.exit(1);
}

if (fs.existsSync(OUT_SITE)) {
  fs.rmSync(OUT_SITE, { recursive: true, force: true });
}
copyDir(EXPORT_DIR, OUT_SITE);
writeRedirectIndex();

console.log(`\n→ Static site written to ${OUT_SITE}\n`);
console.log(`→ Token bundle at ${path.join(ROOT, "dist", "design-system", "bundle")}\n`);
