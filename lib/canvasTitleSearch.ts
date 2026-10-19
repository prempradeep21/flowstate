/**
 * Whether a canvas title matches a search query typed into a canvas list.
 *
 * Every whitespace-separated word of the query has to appear somewhere in the
 * title, in any order and case — so "disney walt" finds "Walt Disney" and
 * "jag theatre" finds "Jagadamba Theatre — Rooted Stories". An empty query
 * matches everything.
 */
export function canvasTitleMatches(title: string, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = title.toLowerCase();
  return words.every((word) => haystack.includes(word));
}
