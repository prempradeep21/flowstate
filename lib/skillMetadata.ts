/**
 * Derives skill-card display data from a raw uploaded skill file (typically
 * a SKILL.md-style markdown file with optional YAML-ish frontmatter). No
 * external YAML dependency — real skill frontmatter seen in practice is flat
 * key: value pairs and simple inline lists, so a small hand-rolled parser
 * avoids pulling a Node-oriented YAML lib into a browser upload path.
 */

export type TokenCost = "low" | "medium" | "high";

export type SecurityFlag = {
  level: "clean" | "flagged";
  note: string;
} | null;

export type Maturity = {
  version: string | null;
  license: string | null;
};

export type SkillCardData = {
  whatItDoes: string;
  /** Only set when the file's own frontmatter declares an author. */
  author?: string;
  tokenCost: TokenCost;
  security: SecurityFlag;
  maturity: Maturity;
  compatibility: string[];
  restrictions: string[];
  topics: string[];
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseInlineList(raw: string): string[] {
  const trimmed = raw.trim();
  const bracketed = trimmed.match(/^\[([\s\S]*)\]$/);
  const inner = bracketed ? bracketed[1] : trimmed;
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseFrontmatter(raw: string): Record<string, string | string[]> {
  const fields: Record<string, string | string[]> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    const cleaned = value.trim();
    if (!cleaned) continue;
    if (cleaned.startsWith("[") || cleaned.includes(",")) {
      fields[key] = parseInlineList(cleaned);
    } else {
      fields[key] = cleaned.replace(/^["']|["']$/g, "");
    }
  }
  return fields;
}

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstParagraph(body: string): string {
  const withoutHeadings = body
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"));
  const paragraphs = withoutHeadings
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs[0] ?? "";
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

const SECURITY_KEYWORDS: Array<{ pattern: RegExp; note: string }> = [
  { pattern: /rm\s+-rf/i, note: "Mentions destructive shell commands (rm -rf)." },
  { pattern: /\bsudo\b/i, note: "Mentions privilege escalation (sudo)." },
  { pattern: /\beval\(/i, note: "Mentions dynamic code execution (eval)." },
  { pattern: /allowed-tools/i, note: "Declares restricted tool access." },
  { pattern: /prompt injection/i, note: "Calls out prompt-injection risk." },
  { pattern: /destructive/i, note: "Explicitly flags destructive behavior." },
];

const TOKEN_COST_THRESHOLDS = { low: 2_000, medium: 6_000 } as const;

export function deriveTokenCost(fullText: string): TokenCost {
  const length = fullText.length;
  if (length < TOKEN_COST_THRESHOLDS.low) return "low";
  if (length < TOKEN_COST_THRESHOLDS.medium) return "medium";
  return "high";
}

export function deriveSecurityFlag(fullText: string): SecurityFlag {
  for (const { pattern, note } of SECURITY_KEYWORDS) {
    if (pattern.test(fullText)) {
      return { level: "flagged", note };
    }
  }
  return null;
}

export function deriveSkillCardData(rawText: string): SkillCardData {
  const match = rawText.match(FRONTMATTER_RE);
  const frontmatter = match ? parseFrontmatter(match[1]) : {};
  const body = match ? rawText.slice(match[0].length) : rawText;

  const description = asString(frontmatter.description);
  const whatItDoes = description
    ? truncate(description, 220)
    : truncate(firstParagraph(body), 220) || "No description provided.";

  return {
    whatItDoes,
    author: asString(frontmatter.author),
    tokenCost: deriveTokenCost(rawText),
    security: deriveSecurityFlag(rawText),
    maturity: {
      version: asString(frontmatter.version) ?? null,
      license: asString(frontmatter.license) ?? null,
    },
    compatibility: asList(frontmatter.compatibility),
    restrictions: asList(frontmatter.restrictions),
    topics: asList(frontmatter.topics ?? frontmatter.tags),
  };
}
