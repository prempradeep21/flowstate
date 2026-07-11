import type { Skill } from "./types";

/**
 * Curated starter set — prose-guidance skills researched from ui-skills.com's
 * catalog (github.com/ibelick/ui-skills). Local/marketplace scanning can
 * replace this once the card design is validated.
 */
export const SEED_SKILLS: Skill[] = [
  {
    slug: "swiss-design",
    name: "Swiss Design",
    authorName: "zeke",
    authorHandle: "zeke",
    authorAvatarUrl: "https://github.com/zeke.png",
    sourceUrl: "https://github.com/zeke/swiss-design-skill",
    whatItDoes:
      "Applies Swiss International Style using Tailwind CSS — grid-first layouts, one accent color, narrow text columns, whitespace as structure.",
    tokenCost: "high",
    security: null,
    restrictions: ["Tailwind CSS only"],
    maturity: { version: "1.0", license: "MIT" },
    compatibility: ["Tailwind"],
    topics: ["systems", "visual", "craft"],
  },
  {
    slug: "oklch-skill",
    name: "OKLCH Color Space",
    authorName: "jakubkrehel",
    authorHandle: "jakubkrehel",
    authorAvatarUrl: "https://github.com/jakubkrehel.png",
    sourceUrl: "https://github.com/jakubkrehel/oklch-skill",
    whatItDoes:
      "Converts, audits, and generates color palettes in the OKLCH color space — perceptually uniform lightness, stable hue, gamut-aware.",
    tokenCost: "high",
    security: null,
    restrictions: [],
    maturity: { version: null, license: null },
    compatibility: ["CSS", "Tailwind"],
    topics: ["accessibility", "color", "systems"],
  },
  {
    slug: "rams",
    name: "Rams Design Review",
    authorName: "rams.ai",
    authorHandle: "rams",
    authorAvatarUrl: "https://www.rams.ai/favicon.ico",
    sourceUrl: "https://www.rams.ai/rams.md",
    whatItDoes:
      "Runs a scored accessibility and visual design review — WCAG checks tiered Critical/Serious/Moderate, plus layout, typography, and color consistency.",
    tokenCost: "medium",
    security: null,
    restrictions: [],
    maturity: { version: null, license: null },
    compatibility: ["Framework-agnostic"],
    topics: ["visual", "accessibility", "interaction"],
  },
  {
    slug: "industrial-brutalist-ui",
    name: "Industrial Brutalist UI",
    authorName: "Leonxlnx",
    authorHandle: "Leonxlnx",
    authorAvatarUrl: "https://github.com/Leonxlnx.png",
    sourceUrl: "https://github.com/Leonxlnx/taste-skill",
    whatItDoes:
      "Generates an Industrial Brutalist aesthetic for data-heavy interfaces — Swiss print typography colliding with military terminal design.",
    tokenCost: "medium",
    security: null,
    restrictions: [],
    maturity: { version: null, license: null },
    compatibility: ["CSS", "SVG"],
    topics: ["taste", "visual", "interaction"],
  },
  {
    slug: "delight",
    name: "Delight",
    authorName: "pbakaus",
    authorHandle: "pbakaus",
    authorAvatarUrl: "https://github.com/pbakaus.png",
    sourceUrl: "https://github.com/pbakaus/impeccable",
    whatItDoes:
      "Guides where and how to add delight to a product — micro-interactions, personality-driven copy, and sound, without ever blocking core functionality.",
    tokenCost: "low",
    security: null,
    restrictions: [],
    maturity: { version: null, license: null },
    compatibility: ["Framer Motion", "GSAP"],
    topics: ["interaction", "motion", "taste"],
  },
];
