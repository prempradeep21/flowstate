/**
 * One-shot migration: arbitrary text-[Npx] → canvas typography tokens.
 * Safe to re-run (idempotent for mapped values).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["components", "lib", "app"];
const SKIP = /spec-viewer|\.test\.|node_modules|\.next/;

const TEXT_REPLACEMENTS = [
  ["text-[22.5px]", "text-canvas-brand"],
  ["text-[56px]", "text-canvas-display"],
  ["text-[52px]", "text-canvas-display"],
  ["text-[21px]", "text-canvas-heading"],
  ["text-[20px]", "text-canvas-heading"],
  ["text-[18px]", "text-canvas-heading"],
  ["text-[17px]", "text-canvas-heading"],
  ["text-[16px]", "text-canvas-body-lg"],
  ["text-[15px]", "text-canvas-body-lg"],
  ["text-[14px]", "text-canvas-body"],
  ["text-[13px]", "text-canvas-body-sm"],
  ["text-[12px]", "text-canvas-compact"],
  ["text-[11px]", "text-canvas-caption"],
  ["text-[10px]", "text-canvas-micro"],
  ["text-[9px]", "text-canvas-micro"],
  ["text-lg", "text-canvas-heading"],
  ["text-sm", "text-canvas-body"],
  ["text-xs", "text-canvas-compact"],
];

const CLASS_REPLACEMENTS = [
  ["bg-[#f4f4f5]", "bg-canvas-codeBg"],
  ["bg-[#1a1a1a]", "bg-canvas-stageDark"],
  ["text-[#116329]", "text-canvas-syntaxComment"],
  ["text-[#953800]", "text-canvas-syntaxString"],
  ["text-[#0550AE]", "text-canvas-syntaxKeyword"],
  ["rounded-lg", "rounded-canvas-sm"],
  ["rounded-sm", "rounded-canvas-xs"],
  ["text-red-600", "text-canvas-danger"],
  ["bg-red-50", "bg-canvas-dangerSoft"],
  ["border-red-200", "border-canvas-dangerBorder"],
  ["hover:bg-red-50", "hover:bg-canvas-dangerSoft"],
  ["hover:text-red-600", "hover:text-canvas-danger"],
  ["text-canvas-question", "text-canvas-accent"],
  ["bg-canvas-question", "bg-canvas-accent"],
  ["border-canvas-question", "border-canvas-accent"],
  ["text-red-400", "text-canvas-danger"],
  ["border-red-400", "border-canvas-danger/40"],
  ["bg-emerald-400", "bg-canvas-success/70"],
  ["bg-emerald-500", "bg-canvas-success"],
  ["text-amber-200/90", "text-canvas-warningSoft/90"],
  ["border-amber-500/30", "border-canvas-warning/30"],
  ["bg-amber-500/10", "bg-canvas-warning/10"],
  ["text-amber-700", "text-canvas-warningText"],
  ["text-amber-800", "text-canvas-warningText"],
  ["bg-amber-50", "bg-canvas-warningSoft"],
  ["ring-amber-200/80", "ring-canvas-warningRing/80"],
  ["border-amber-400", "border-canvas-warning"],
  ["border-amber-500/35", "border-canvas-warning/35"],
  ["text-amber-700/90", "text-canvas-warningText/90"],
  ["text-amber-900", "text-canvas-warningText"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (SKIP.test(p)) continue;
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|css)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const dir of DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (file.includes("lib/design/tokens.ts")) continue;
    if (file.includes("migrate-design-tokens")) continue;
    let src = fs.readFileSync(file, "utf8");
    const orig = src;
    for (const [from, to] of [...TEXT_REPLACEMENTS, ...CLASS_REPLACEMENTS]) {
      src = src.split(from).join(to);
    }
    if (src !== orig) {
      fs.writeFileSync(file, src);
      changed++;
      console.log("updated:", path.relative(ROOT, file));
    }
  }
}
console.log(`Done. ${changed} files updated.`);
