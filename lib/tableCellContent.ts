import type { TableCell } from "@/lib/artifactTypes";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

export interface NormalizedTableCell {
  text: string;
}

/**
 * Display text for a table cell. Tables render plain text only — legacy
 * `tags` / `badge` annotations are lifted into columns upstream by
 * `normalizeTableArtifactData`, never drawn as pills.
 */
export function normalizeTableCell(
  cell: string | TableCell | undefined,
): NormalizedTableCell {
  if (cell == null) return { text: "" };
  if (typeof cell === "string") {
    return { text: formatRichTextForDisplay(cell) };
  }
  return { text: formatRichTextForDisplay(cell.value ?? "") };
}
