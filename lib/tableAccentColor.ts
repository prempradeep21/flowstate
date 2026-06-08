const TABLE_ACCENT_PALETTE = [
  "#5B7FD6", // slate blue
  "#D45B8A", // rose
  "#3A9E6F", // emerald
  "#C98A2E", // amber
  "#8B5CF6", // violet
  "#0E9EB5", // teal
  "#E06C3A", // orange
  "#7C5CBF", // purple
  "#2D8C8C", // cyan-green
  "#B84D6F", // raspberry
  "#4A7C59", // forest
  "#6B5B95", // indigo
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function tableAccentColor(seed: string): string {
  if (!seed) return TABLE_ACCENT_PALETTE[0]!;
  return TABLE_ACCENT_PALETTE[hashString(seed) % TABLE_ACCENT_PALETTE.length]!;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function tableAccentStyles(seed: string): Record<string, string> {
  const accent = tableAccentColor(seed);
  const { r, g, b } = hexToRgb(accent);
  return {
    ["--table-accent" as string]: accent,
    ["--table-accent-soft" as string]: `rgba(${r}, ${g}, ${b}, 0.12)`,
    ["--table-accent-hover" as string]: `rgba(${r}, ${g}, ${b}, 0.042)`,
    ["--table-accent-border" as string]: `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
}
