import type { TableCell, TableTag, TableTagTone } from "@/lib/artifactTypes";

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

export function normalizeTableCell(
  cell: string | TableCell | undefined,
): NormalizedTableCell {
  if (cell == null) return { text: "", tags: [] };
  if (typeof cell === "string") return { text: cell, tags: [] };

  const text = cell.value ?? "";
  const tags: TableTag[] = [...(cell.tags ?? [])];
  if (cell.badge && !tags.some((t) => t.label === cell.badge)) {
    tags.push({ label: cell.badge, tone: "neutral" });
  }
  return { text, tags };
}

export function tableTagClassName(tone: TableTagTone | undefined, compact: boolean): string {
  const size = compact ? "text-canvas-micro px-1.5 py-0" : "text-canvas-caption px-2 py-0.5";
  const palette = TABLE_TAG_TONE_CLASSES[tone ?? "neutral"];
  return `inline-flex shrink-0 items-center rounded-full font-medium ${size} ${palette}`;
}
