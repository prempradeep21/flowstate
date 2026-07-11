import fs from "node:fs";
import path from "node:path";

export function readLegalDocument(filename: string): string {
  const filePath = path.join(process.cwd(), "content", "legal", filename);
  const raw = fs.readFileSync(filePath, "utf8");
  // Strip pandoc-style heading anchors e.g. "## Title {#cookies}"
  return raw.replace(/\s+\{#[\w-]+\}/g, "");
}
