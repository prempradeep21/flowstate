import type { CanvasClipboardPayload } from "@/lib/canvasClipboard";

export function copySuccessMessage(payload: CanvasClipboardPayload): string {
  const artifacts = payload.items.filter((item) => item.kind === "artifact").length;
  const skills = payload.items.filter((item) => item.kind === "skill").length;

  if (artifacts > 0 && skills > 0) {
    const total = artifacts + skills;
    return `Copied ${total} items`;
  }
  if (artifacts === 1) return "Artifact copied";
  if (artifacts > 1) return `${artifacts} artifacts copied`;
  if (skills === 1) return "Skill copied";
  if (skills > 1) return `${skills} skills copied`;
  return "Copied";
}
