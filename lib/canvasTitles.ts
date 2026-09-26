/**
 * Title helpers for canvases stamped into an account from a code-defined
 * source (sample canvases, imported transcript canvases).
 *
 * Copying the same source twice is a normal thing to do — reviewing a change,
 * keeping the previous version around — so the second copy is numbered rather
 * than refused or silently made indistinguishable from the first.
 */

/** "Henry Ford", "Henry Ford (2)", "Henry Ford (3)" … */
export function dedupeTitle(base: string, existingTitles: string[]): string {
  if (!existingTitles.includes(base)) return base;
  let n = 2;
  while (existingTitles.includes(`${base} (${n})`)) n += 1;
  return `${base} (${n})`;
}
