/**
 * Marks store writes that only re-derive layout from content: bento re-packs,
 * the masthead restack, chapter spine shifts. Every client computes these
 * itself from the same content, so they must not start a save of their own.
 * When they did, two open clients took turns: one loaded the other's save,
 * re-packed with its own measurements, saved, and so on, and chapter frames
 * collapsed and re-expanded with each round. A derived write still goes out
 * with the next real edit's save.
 *
 * Zustand notifies subscribers synchronously inside `set()`, so the
 * persistence subscriber sees this flag for exactly the writes made in `fn`.
 */
let depth = 0;

export function runDerivedLayoutWrite(fn: () => void): void {
  depth += 1;
  try {
    fn();
  } finally {
    depth -= 1;
  }
}

export function isDerivedLayoutWrite(): boolean {
  return depth > 0;
}
