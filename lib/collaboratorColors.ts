const CURSOR_COLORS = [
  "#E57373",
  "#64B5F6",
  "#81C784",
  "#FFB74D",
  "#BA68C8",
  "#4DD0E1",
  "#F06292",
  "#A1887F",
];

export function collaboratorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]!;
}
