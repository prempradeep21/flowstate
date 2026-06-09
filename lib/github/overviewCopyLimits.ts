/**
 * Repository Explorer overview copy limits — single source of truth.
 * See .cursor/rules/repo-explorer-artifact.mdc
 */

/** Two paragraphs, each ~50% shorter than the original spec (~55 words / ≤2 sentences). */
export const WHAT_IT_IS_LIMITS = {
  maxParagraphs: 2,
  /** Max sentences per paragraph (strict). */
  sentencesPerParagraph: 2,
  /** ~110 words total across both paragraphs (was ~120–220). */
  maxWordsTotal: 110,
  /** ~55 words per paragraph. */
  maxWordsPerParagraph: 55,
  /** Minimum total length before we expand from README heuristics. */
  minChars: 120,
} as const;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Remove URLs, markdown artifacts, notes, and disclaimer noise — keep human prose only. */
export function sanitizeSummaryText(text: string): string {
  let out = text
    .replace(/\r\n/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, (_, label: string) => {
      const t = label.trim();
      if (!t || /^(link|here|click|docs?|source)$/i.test(t)) return "";
      return t;
    })
    .replace(/\(\s*https?:\/\/[^)]+\)/gi, "")
    .replace(/https?:\/\/[^\s)\]>]+/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\bNote:\s*/gi, "")
    .replace(/\bImportant:\s*/gi, "")
    .replace(/\bDisclaimer:\s*/gi, "")
    .replace(/\bSee also:?\s*/gi, "")
    .replace(/\bFor (more )?information,?\s*(see|visit)\s*/gi, "")
    .replace(/\s*,?\s*see\s+[a-z0-9.-]+\.[a-z]{2,}\b\.?/gi, "")
    .replace(/\bthis repository contains\b[^.!?]*[.!?]?/gi, "")
    .replace(/\bfor information about\b[^.!?]*[.!?]?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  out = out
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\s+([)\]])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();

  return out;
}

/** True when copy still looks like raw README / disclaimer text, not a summary. */
export function whatItIsLooksLikeRawReadme(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return (
    /https?:\/\//i.test(t) ||
    /\bnote:/i.test(t) ||
    /\[\s*\]/.test(t) ||
    /\(\s*\)/.test(t) ||
    /for information about/i.test(t) ||
    /this repository contains/i.test(t) ||
    /agentskills\.io/i.test(t)
  );
}

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function truncateToSentenceLimit(text: string, maxSentences: number): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= maxSentences) return text.trim();
  return sentences.slice(0, maxSentences).join(" ");
}

/** Enforce compact two-paragraph "What it is" copy for every repo. */
export function enforceWhatItIsLimits(text: string): string {
  const { maxParagraphs, sentencesPerParagraph, maxWordsPerParagraph, maxWordsTotal } =
    WHAT_IT_IS_LIMITS;

  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((p) => sanitizeSummaryText(p.replace(/\n+/g, " ")))
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return text.trim();

  let compact = paragraphs.slice(0, maxParagraphs).map((p) => {
    let out = truncateToSentenceLimit(p, sentencesPerParagraph);
    out = truncateToWordLimit(out, maxWordsPerParagraph);
    return out;
  });

  let totalWords = compact.reduce((n, p) => n + countWords(p), 0);
  if (totalWords > maxWordsTotal && compact.length > 1) {
    const budget = [
      Math.floor(maxWordsTotal / 2),
      maxWordsTotal - Math.floor(maxWordsTotal / 2),
    ];
    compact = compact.map((p, i) => truncateToWordLimit(p, budget[i] ?? maxWordsPerParagraph));
  } else if (totalWords > maxWordsTotal) {
    compact = [truncateToWordLimit(compact[0] ?? text, maxWordsTotal)];
  }

  if (compact.length === 1 && countWords(compact[0]) > 20) {
    const sentences = compact[0]
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length >= 2) {
      compact = [
        truncateToWordLimit(sentences[0], maxWordsPerParagraph),
        truncateToWordLimit(sentences.slice(1).join(" "), maxWordsPerParagraph),
      ].filter((p) => p.length > 20);
    }
  }

  return compact.join("\n\n");
}

/** Sanitize then enforce limits — use on all API-bound "What it is" copy. */
export function polishWhatItIsCopy(text: string): string {
  return enforceWhatItIsLimits(text);
}
