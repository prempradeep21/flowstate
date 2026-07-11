import fs from "fs";
import path from "path";
import {
  findSpecSection,
  parseSpecSections,
  type SpecSection,
} from "@/lib/specViewer/parseSpec";

export function readBranchAiMarkdown(): string {
  const filePath = path.join(process.cwd(), "branch-ai.md");
  return fs.readFileSync(filePath, "utf8");
}

export function readMarkdownFile(relativePath: string): string {
  const filePath = path.join(process.cwd(), relativePath);
  return fs.readFileSync(filePath, "utf8");
}

export function getSpecSection(titleIncludes: string): SpecSection | null {
  const markdown = readBranchAiMarkdown();
  const sections = parseSpecSections(markdown);
  return findSpecSection(sections, titleIncludes) ?? null;
}
