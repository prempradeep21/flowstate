/**
 * Curated subset of simple-icons brand marks used for the "Compatibility"
 * chip on skill cards. Imported by name (not the whole package) so only the
 * icons actually referenced here end up in the client bundle.
 */
import {
  siApple,
  siCss,
  siFigma,
  siNextdotjs,
  siNuxt,
  siReact,
  siSwift,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVite,
  siVuedotjs,
} from "simple-icons";

export type BrandIcon = {
  /** SVG path data, 24x24 viewBox, single path fill. */
  path: string;
  /** Brand's official hex color, rendered as-is (not theme-tinted). */
  hex: string;
  /** Human-readable name for alt text / tooltips. */
  title: string;
};

/**
 * Lookup key -> brand icon. Keys are lowercase, loosely matched against
 * whatever compatibility string a skill declares (see resolveBrandIcon).
 */
export const BRAND_ICONS: Record<string, BrandIcon> = {
  tailwind: { path: siTailwindcss.path, hex: `#${siTailwindcss.hex}`, title: "Tailwind CSS" },
  react: { path: siReact.path, hex: `#${siReact.hex}`, title: "React" },
  vue: { path: siVuedotjs.path, hex: `#${siVuedotjs.hex}`, title: "Vue.js" },
  swiftui: { path: siSwift.path, hex: `#${siSwift.hex}`, title: "SwiftUI" },
  swift: { path: siSwift.path, hex: `#${siSwift.hex}`, title: "Swift" },
  apple: { path: siApple.path, hex: `#${siApple.hex}`, title: "Apple" },
  nextjs: { path: siNextdotjs.path, hex: `#${siNextdotjs.hex}`, title: "Next.js" },
  nuxt: { path: siNuxt.path, hex: `#${siNuxt.hex}`, title: "Nuxt" },
  figma: { path: siFigma.path, hex: `#${siFigma.hex}`, title: "Figma" },
  threejs: { path: siThreedotjs.path, hex: `#${siThreedotjs.hex}`, title: "Three.js" },
  vite: { path: siVite.path, hex: `#${siVite.hex}`, title: "Vite" },
  typescript: { path: siTypescript.path, hex: `#${siTypescript.hex}`, title: "TypeScript" },
  css: { path: siCss.path, hex: `#${siCss.hex}`, title: "CSS" },
};

/** Neutral fallback for a compatibility label with no matching brand mark. */
export const GENERIC_FRAMEWORK_ICON: BrandIcon = {
  // Simple bracket/code glyph — not a real brand, just a placeholder shape.
  path: "M8.5 4.5 3 12l5.5 7.5 1.4-1.1L5.6 12l4.3-6.4-1.4-1.1Zm7 0-1.4 1.1L18.4 12l-4.3 6.4 1.4 1.1L21 12l-5.5-7.5Z",
  hex: "#8B8A86",
  title: "Framework-agnostic",
};

/** Matches a free-text compatibility label to a known brand icon, or the generic fallback. */
export function resolveBrandIcon(label: string): BrandIcon {
  const key = label.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [lookupKey, icon] of Object.entries(BRAND_ICONS)) {
    if (key.includes(lookupKey)) return icon;
  }
  return GENERIC_FRAMEWORK_ICON;
}
