import type { TableCell, TableTag, TableTagTone } from "@/lib/artifactTypes";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

export interface NormalizedTableCell {
  text: string;
  tags: TableTag[];
}

export const TABLE_TAG_TONE_CLASSES: Record<TableTagTone, string> = {
  neutral: "bg-canvas-border/50 text-canvas-muted",
  success:
    "bg-canvas-successSoft text-canvas-successText ring-1 ring-canvas-successRing/80",
  warning:
    "bg-canvas-warningSoft text-canvas-warningText ring-1 ring-canvas-warningRing/80",
  danger:
    "bg-canvas-tagDangerSoft text-canvas-tagDanger ring-1 ring-canvas-tagDangerRing/80",
  info: "bg-canvas-infoSoft text-canvas-infoText ring-1 ring-canvas-infoRing/80",
};

function formatTableTags(tags: TableTag[]): TableTag[] {
  return tags.map((tag) => ({
    ...tag,
    label: formatRichTextForDisplay(tag.label),
  }));
}

export function normalizeTableCell(
  cell: string | TableCell | undefined,
): NormalizedTableCell {
  if (cell == null) return { text: "", tags: [] };
  if (typeof cell === "string") {
    return { text: formatRichTextForDisplay(cell), tags: [] };
  }

  const text = formatRichTextForDisplay(cell.value ?? "");
  const tags: TableTag[] = formatTableTags([...(cell.tags ?? [])]);
  if (
    cell.badge &&
    !(cell.tags ?? []).some((t) => t.label === cell.badge) &&
    !tags.some((t) => t.label === formatRichTextForDisplay(cell.badge!))
  ) {
    tags.push({
      label: formatRichTextForDisplay(cell.badge),
      tone: "neutral",
    });
  }
  return { text, tags };
}

export function tableTagClassName(tone: TableTagTone | undefined, compact: boolean): string {
  const size = compact ? "text-canvas-micro px-1.5 py-0" : "text-canvas-caption px-2 py-0.5";
  const palette = TABLE_TAG_TONE_CLASSES[tone ?? "neutral"];
  return `inline-flex shrink-0 items-center rounded-full font-medium ${size} ${palette}`;
}
