export type CanvasFontSource = "builtin" | "local" | "google";

export type CanvasFontOption = {
  id: string;
  label: string;
  source: CanvasFontSource;
  /** CSS font-family value applied when selected */
  family: string;
  /** Google Fonts only — inject stylesheet on first use (deduped by href) */
  googleFontsHref?: string;
};

/** Latest embed — includes Lora for display section */
export const GOOGLE_FONTS_BUNDLE_HREF =
  "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Figtree:ital,wght@0,300..900;1,300..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Parkinsans:wght@300..800&family=Unbounded:wght@200..900&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap";

export const SANCHEZ_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Sanchez:ital,wght@0,400;1,400&display=swap";

export const DEFAULT_BODY_FONT_ID = "parkinsans";
export const DEFAULT_DISPLAY_FONT_ID = "denton";

/** Body — card text, labels, answers */
export const CANVAS_BODY_FONT_OPTIONS: CanvasFontOption[] = [
  {
    id: "archivo",
    label: "Archivo",
    source: "builtin",
    family: "var(--font-archivo)",
  },
  {
    id: "satoshi",
    label: "Satoshi",
    source: "local",
    family: "var(--font-satoshi)",
  },
  {
    id: "sanchez",
    label: "Sanchez",
    source: "google",
    family: '"Sanchez", serif',
    googleFontsHref: SANCHEZ_GOOGLE_FONTS_HREF,
  },
  {
    id: "figtree",
    label: "Figtree",
    source: "google",
    family: '"Figtree", sans-serif',
    googleFontsHref: GOOGLE_FONTS_BUNDLE_HREF,
  },
  {
    id: "parkinsans",
    label: "Parkinsans",
    source: "builtin",
    family: "var(--font-parkinsans)",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    source: "google",
    family: '"Urbanist", sans-serif',
    googleFontsHref: GOOGLE_FONTS_BUNDLE_HREF,
  },
];

/** Display — headlines and branding (replaces Denton) */
export const CANVAS_DISPLAY_FONT_OPTIONS: CanvasFontOption[] = [
  {
    id: "denton",
    label: "Denton",
    source: "builtin",
    family: "var(--font-denton)",
  },
  {
    id: "lora",
    label: "Lora",
    source: "google",
    family: '"Lora", serif',
    googleFontsHref: GOOGLE_FONTS_BUNDLE_HREF,
  },
  {
    id: "abril-fatface",
    label: "Abril Fatface",
    source: "google",
    family: '"Abril Fatface", serif',
    googleFontsHref: GOOGLE_FONTS_BUNDLE_HREF,
  },
  {
    id: "unbounded",
    label: "Unbounded",
    source: "google",
    family: '"Unbounded", sans-serif',
    googleFontsHref: GOOGLE_FONTS_BUNDLE_HREF,
  },
];

export function getBodyFontOption(id: string): CanvasFontOption | undefined {
  return CANVAS_BODY_FONT_OPTIONS.find((o) => o.id === id);
}

export function getDisplayFontOption(id: string): CanvasFontOption | undefined {
  return CANVAS_DISPLAY_FONT_OPTIONS.find((o) => o.id === id);
}

export function collectGoogleFontHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const option of [
    ...CANVAS_BODY_FONT_OPTIONS,
    ...CANVAS_DISPLAY_FONT_OPTIONS,
  ]) {
    if (option.googleFontsHref) hrefs.add(option.googleFontsHref);
  }
  return [...hrefs];
}
