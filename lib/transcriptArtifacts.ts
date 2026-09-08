import type {
  ArtifactKind,
  ArtifactPayload,
  ClaimArtifactData,
  EpisodeArtifactData,
  EpisodeChapterRef,
  LinkGroupArtifactData,
  LinkGroupLink,
  LinkGroupSection,
  ClaimSide,
  DefinitionArtifactData,
  MechanismArtifactData,
  MechanismEdge,
  MechanismStep,
  QuoteArtifactData,
  StatArtifactData,
} from "@/lib/artifactTypes";

/*
 * Transcript artifacts — the five kinds a conversation produces that a Q&A turn
 * does not: a line worth keeping, a figure worth keeping, a term that needed
 * defining, a proposition someone pushed back on, and a chain of cause.
 *
 * They share a file because they share an origin: all five are authored by the
 * transcript-import builders (see .claude/skills/transcript-artifacts), none is
 * reachable from emit_artifact, and every field is a verbatim lift from the
 * source. Nothing here computes, infers or judges — a normalizer that had to
 * invent a value returns null and the artifact is dropped instead.
 */

/** Source card ids for manual placement (no chat turn). */
export const MANUAL_QUOTE_SOURCE_CARD_ID = "__manual_quote__";
export const MANUAL_STAT_SOURCE_CARD_ID = "__manual_stat__";
export const MANUAL_DEFINITION_SOURCE_CARD_ID = "__manual_definition__";
export const MANUAL_CLAIM_SOURCE_CARD_ID = "__manual_claim__";
export const MANUAL_MECHANISM_SOURCE_CARD_ID = "__manual_mechanism__";

/**
 * A pull-quote past this length stops being a quote and becomes a paragraph —
 * the reader skims it instead of hearing it.
 */
export const QUOTE_MAX_WORDS = 35;

/** Beyond this a mechanism is a diagram nobody reads at canvas zoom. */
export const MECHANISM_MAX_STEPS = 7;

export const QUOTE_ARTIFACT_WIDTH = 520;
export const QUOTE_ARTIFACT_HEIGHT = 240;
export const STAT_ARTIFACT_WIDTH = 380;
export const STAT_ARTIFACT_HEIGHT = 260;
export const DEFINITION_ARTIFACT_WIDTH = 520;
export const DEFINITION_ARTIFACT_HEIGHT = 220;
export const CLAIM_ARTIFACT_WIDTH = 680;
export const CLAIM_ARTIFACT_HEIGHT = 420;
export const MECHANISM_ARTIFACT_WIDTH = 680;
export const MECHANISM_ARTIFACT_HEIGHT = 220;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(value: unknown): string | undefined {
  const out = str(value);
  return out || undefined;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Trim a quote to its first QUOTE_MAX_WORDS words, marking the elision. */
export function truncateQuote(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= QUOTE_MAX_WORDS) return words.join(" ");
  return `${words.slice(0, QUOTE_MAX_WORDS).join(" ")}…`;
}

export function isValidQuoteLength(text: string): boolean {
  const trimmed = text.trim();
  return Boolean(trimmed) && countWords(trimmed) <= QUOTE_MAX_WORDS;
}

export function normalizeQuoteArtifactData(raw: unknown): QuoteArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    text: truncateQuote(str(o.text)),
    speaker: str(o.speaker),
    timestamp: optionalStr(o.timestamp),
    context: optionalStr(o.context),
  };
}

export function normalizeStatArtifactData(raw: unknown): StatArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawValue = o.value;
  const value =
    typeof rawValue === "number" && Number.isFinite(rawValue)
      ? String(rawValue)
      : str(rawValue);

  // A delta needs both ends. One end alone is a number without a comparison,
  // which is what the plain value field is already for.
  const delta = (o.delta ?? {}) as Record<string, unknown>;
  const from = str(delta.from);
  const to = str(delta.to);

  return {
    value,
    label: str(o.label),
    unit: optionalStr(o.unit),
    delta: from && to ? { from, to } : undefined,
    source: optionalStr(o.source),
    speaker: optionalStr(o.speaker),
  };
}

export function normalizeDefinitionArtifactData(
  raw: unknown,
): DefinitionArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    term: str(o.term),
    gloss: str(o.gloss),
    example: optionalStr(o.example),
    speaker: optionalStr(o.speaker),
  };
}

function normalizeClaimSide(raw: unknown): ClaimSide {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    speaker: str(o.speaker),
    text: str(o.text),
    timestamp: optionalStr(o.timestamp),
  };
}

export function normalizeClaimArtifactData(raw: unknown): ClaimArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    topic: str(o.topic),
    proposition: normalizeClaimSide(o.proposition),
    counter: normalizeClaimSide(o.counter),
  };
}

export function normalizeMechanismArtifactData(
  raw: unknown,
): MechanismArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;

  const steps: MechanismStep[] = [];
  const seen = new Set<string>();
  const rawSteps = Array.isArray(o.steps) ? o.steps : [];
  for (const entry of rawSteps) {
    if (steps.length >= MECHANISM_MAX_STEPS) break;
    if (!entry || typeof entry !== "object") continue;
    const s = entry as Record<string, unknown>;
    const label = str(s.label);
    if (!label) continue;
    const id = str(s.id) || `step-${steps.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    steps.push({ id, label, note: optionalStr(s.note) });
  }

  // Edges pointing at steps that were dropped would render as dangling arrows.
  const edges: MechanismEdge[] = [];
  const rawEdges = Array.isArray(o.edges) ? o.edges : [];
  for (const entry of rawEdges) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const from = str(e.from);
    const to = str(e.to);
    if (!seen.has(from) || !seen.has(to) || from === to) continue;
    edges.push({ from, to, label: optionalStr(e.label) });
  }

  // A chain with no authored edges is still a chain: link it in order rather
  // than rendering isolated boxes.
  if (edges.length === 0 && steps.length > 1) {
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({ from: steps[i]!.id, to: steps[i + 1]!.id });
    }
  }

  return { steps, edges };
}

/*
 * Payload constructors. Builders call these rather than writing payload
 * literals, so every authored artifact passes through the same normalizer the
 * renderer trusts — quote truncation, delta pairing and edge validation happen
 * once, at authoring time, instead of being re-checked at every render.
 */

export function quotePayload(
  title: string,
  data: QuoteArtifactData,
): Extract<ArtifactPayload, { type: "quote" }> {
  return { type: "quote", title, data: normalizeQuoteArtifactData(data) };
}

export function statPayload(
  title: string,
  data: StatArtifactData,
): Extract<ArtifactPayload, { type: "stat" }> {
  return { type: "stat", title, data: normalizeStatArtifactData(data) };
}

export function definitionPayload(
  title: string,
  data: DefinitionArtifactData,
): Extract<ArtifactPayload, { type: "definition" }> {
  return {
    type: "definition",
    title,
    data: normalizeDefinitionArtifactData(data),
  };
}

export function claimPayload(
  title: string,
  data: ClaimArtifactData,
): Extract<ArtifactPayload, { type: "claim" }> {
  return { type: "claim", title, data: normalizeClaimArtifactData(data) };
}

export function mechanismPayload(
  title: string,
  data: MechanismArtifactData,
): Extract<ArtifactPayload, { type: "mechanism" }> {
  return {
    type: "mechanism",
    title,
    data: normalizeMechanismArtifactData(data),
  };
}

/*
 * Episode masthead and link directory.
 *
 * These two describe the *source* rather than the conversation inside it — the
 * video and its description, not what was said — so unlike the five above they
 * carry no verbatim guarantee and are exempt from the fidelity gate. They are
 * still bound by the same rule in spirit: a chapter row names a chapter that
 * exists, and a link points at a URL somebody actually published.
 */

export const MANUAL_EPISODE_SOURCE_CARD_ID = "__manual_episode__";
export const MANUAL_LINK_GROUP_SOURCE_CARD_ID = "__manual_linkgroup__";

/*
 * The masthead pair is the entrance to an imported video: the first thing read
 * and the index everything else hangs off. They are drawn at 2.5× the node size
 * of an ordinary artifact, with their content zoomed by the same factor
 * ({@link MASTHEAD_ARTIFACT_SCALE}) so the blow-up is uniform rather than a
 * normal-sized card floating in a large box.
 */
export const MASTHEAD_ARTIFACT_SCALE = 2.5;

/** The kinds that get the {@link MASTHEAD_ARTIFACT_SCALE} treatment on canvas. */
export const MASTHEAD_ARTIFACT_KINDS: ReadonlySet<ArtifactKind> = new Set<ArtifactKind>([
  "episode",
  "linkgroup",
]);

export const EPISODE_ARTIFACT_WIDTH = 560 * MASTHEAD_ARTIFACT_SCALE;
export const EPISODE_ARTIFACT_HEIGHT = 660 * MASTHEAD_ARTIFACT_SCALE;
export const LINK_GROUP_ARTIFACT_WIDTH = 560 * MASTHEAD_ARTIFACT_SCALE;
export const LINK_GROUP_ARTIFACT_HEIGHT = 420 * MASTHEAD_ARTIFACT_SCALE;

/** Google's favicon service — the same source spawnWebsite already uses. */
export function faviconForUrl(url: string): string | undefined {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
  } catch {
    return undefined;
  }
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeEpisodeArtifactData(raw: unknown): EpisodeArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawChapters = Array.isArray(o.chapters) ? o.chapters : [];
  const chapters: EpisodeChapterRef[] = [];
  for (const entry of rawChapters) {
    if (!entry || typeof entry !== "object") continue;
    const c = entry as Record<string, unknown>;
    const label = str(c.label);
    if (!label) continue;
    chapters.push({
      label,
      start: optionalStr(c.start),
      groupId: optionalStr(c.groupId),
    });
  }
  return {
    videoTitle: str(o.videoTitle),
    description: optionalStr(o.description),
    channel: optionalStr(o.channel),
    url: isHttpUrl(o.url) ? String(o.url).trim() : undefined,
    thumb: isHttpUrl(o.thumb) ? String(o.thumb).trim() : undefined,
    duration: optionalStr(o.duration),
    chapters,
  };
}

export function normalizeLinkGroupArtifactData(
  raw: unknown,
): LinkGroupArtifactData {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawSections = Array.isArray(o.sections) ? o.sections : [];
  const sections: LinkGroupSection[] = [];
  for (const entry of rawSections) {
    if (!entry || typeof entry !== "object") continue;
    const sec = entry as Record<string, unknown>;
    const rawLinks = Array.isArray(sec.links) ? sec.links : [];
    const links: LinkGroupLink[] = [];
    for (const linkEntry of rawLinks) {
      if (!linkEntry || typeof linkEntry !== "object") continue;
      const l = linkEntry as Record<string, unknown>;
      // A link with no reachable target is a dead chip, not a link.
      if (!isHttpUrl(l.url)) continue;
      const url = String(l.url).trim();
      links.push({
        label: str(l.label) || url,
        url,
        iconUrl: isHttpUrl(l.iconUrl)
          ? String(l.iconUrl).trim()
          : faviconForUrl(url),
      });
    }
    // An empty section is a heading with nothing under it.
    if (links.length === 0) continue;
    sections.push({ label: str(sec.label), links });
  }
  return { sections };
}

export function episodePayload(
  title: string,
  data: EpisodeArtifactData,
): Extract<ArtifactPayload, { type: "episode" }> {
  return { type: "episode", title, data: normalizeEpisodeArtifactData(data) };
}

export function linkGroupPayload(
  title: string,
  data: LinkGroupArtifactData,
): Extract<ArtifactPayload, { type: "linkgroup" }> {
  return {
    type: "linkgroup",
    title,
    data: normalizeLinkGroupArtifactData(data),
  };
}
