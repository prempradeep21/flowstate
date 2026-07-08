import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildDesignTokenCss,
  buildDesignTokenExport,
  buildTailwindTokenMap,
} from "../lib/design/exportTokens";
import { buildDesignSystemManifest } from "../lib/designSystemRegistry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist", "design-system", "bundle");
const DOCS_SRC = path.join(ROOT, "docs", "design-system");
const DOCS_OUT = path.join(OUT_DIR, "docs");

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function copyDocs() {
  fs.mkdirSync(DOCS_OUT, { recursive: true });
  for (const name of fs.readdirSync(DOCS_SRC)) {
    if (!name.endsWith(".md")) continue;
    fs.copyFileSync(path.join(DOCS_SRC, name), path.join(DOCS_OUT, name));
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  writeJson(path.join(OUT_DIR, "tokens.json"), buildDesignTokenExport());
  writeJson(path.join(OUT_DIR, "tokens.tailwind.json"), buildTailwindTokenMap());
  fs.writeFileSync(path.join(OUT_DIR, "tokens.css"), buildDesignTokenCss(), "utf8");
  writeJson(path.join(OUT_DIR, "manifest.json"), buildDesignSystemManifest());
  copyDocs();

  console.log(`\n→ Design token bundle written to ${OUT_DIR}\n`);
}

main();
