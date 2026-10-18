/*
 * Measured series — numbers computed FROM a transcript rather than spoken IN
 * it. A short interview rarely says three comparable numbers out loud, so
 * class D (numeric series → chart) almost never fires on its own. These are
 * the two series every transcript does carry, and because they are computed
 * from the source at build time they cannot drift from it or be invented.
 * See .claude/skills/transcript-artifacts/references/pickup-classes.md, D*.
 */

/** "7:30" or "1:02:45" → seconds. */
export function timestampToSeconds(stamp: string): number {
  return stamp
    .split(":")
    .map((part) => Number.parseInt(part, 10))
    .reduce((total, part) => total * 60 + part, 0);
}

/** How long each chapter runs, in seconds, from its start/end stamps. */
export function chapterDurations(
  chapters: readonly { start: string; end: string }[],
): number[] {
  return chapters.map(
    (chapter) =>
      timestampToSeconds(chapter.end) - timestampToSeconds(chapter.start),
  );
}

/**
 * Cut a transcript into chapter spans at verbatim anchor phrases. `anchors`
 * holds each chapter's opening words in order, plus one closing anchor where
 * the last chapter ends — so n chapters take n + 1 anchors. Throws if an
 * anchor is missing, because a silently mis-cut span would mis-count.
 */
export function sliceByAnchors(
  transcript: string,
  anchors: readonly string[],
): string[] {
  const offsets = anchors.map((anchor) => {
    const at = transcript.indexOf(anchor);
    if (at < 0) throw new Error(`Chapter anchor not in transcript: "${anchor}"`);
    return at;
  });
  return offsets
    .slice(0, -1)
    .map((start, index) => transcript.slice(start, offsets[index + 1]));
}

/** How many times each theme's pattern matches in each span. */
export function countThemes(
  spans: readonly string[],
  themes: readonly { name: string; pattern: RegExp }[],
): { name: string; data: number[] }[] {
  return themes.map((theme) => {
    const global = new RegExp(
      theme.pattern.source,
      theme.pattern.flags.includes("g")
        ? theme.pattern.flags
        : `${theme.pattern.flags}g`,
    );
    return {
      name: theme.name,
      data: spans.map((span) => span.match(global)?.length ?? 0),
    };
  });
}
