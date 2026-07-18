// Lightweight lexical relevance ranking for memory injection. Pure functions,
// safe on both client (sibling-gist ranking) and server (memory-line
// filtering) — deliberately no LLM or embedding calls on the hot path.

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was",
  "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new",
  "now", "old", "see", "two", "way", "who", "did", "its", "let", "she", "too",
  "use", "that", "with", "have", "this", "will", "your", "from", "they",
  "know", "want", "been", "good", "much", "some", "time", "very", "when",
  "come", "here", "just", "like", "long", "make", "many", "more", "only",
  "over", "such", "take", "than", "them", "well", "were", "what", "would",
  "about", "could", "there", "their", "which", "should", "these", "those",
  "into", "also", "does", "please", "help", "give", "show", "tell", "need",
]);

export function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length >= 3 && !STOP_WORDS.has(raw)) tokens.add(raw);
  }
  return tokens;
}

/** Count of item tokens that appear in the query token set. */
export function overlapScore(queryTokens: Set<string>, text: string): number {
  let score = 0;
  for (const token of tokenize(text)) {
    if (queryTokens.has(token)) score += 1;
  }
  return score;
}

/**
 * Rank items by lexical overlap with `query`, breaking ties by original order
 * (callers pass items most-recent-first so recency wins on ties). Items with
 * zero overlap keep their original relative order after all scored items.
 */
export function rankByRelevance<T>(
  items: T[],
  getText: (item: T) => string,
  query: string,
): T[] {
  const queryTokens = tokenize(query);
  return items
    .map((item, index) => ({
      item,
      index,
      score: overlapScore(queryTokens, getText(item)),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

/** Keep items in order until the combined length exceeds `maxChars`. */
export function capByChars<T>(
  items: T[],
  getLength: (item: T) => number,
  maxChars: number,
): T[] {
  const kept: T[] = [];
  let total = 0;
  for (const item of items) {
    const length = getLength(item);
    if (total + length > maxChars) break;
    kept.push(item);
    total += length;
  }
  return kept;
}
