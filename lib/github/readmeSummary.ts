import { polishWhatItIsCopy } from "@/lib/github/overviewCopyLimits";

export interface WhoItsForDetail {
  /** Who the repository is intended for. */
  intendedFor: string;
  /** Who is supposed to use it day to day. */
  whoShouldUse: string;
  /** Who will benefit / what problems it solves for them. */
  whoItHelps: string;
}

/** Strip markdown noise and pull readable prose from a README for summarization. */
export function extractReadmeProse(readme: string, maxChars = 5000): string {
  const installCut = readme.search(/^#{1,3}\s*install/im);
  const scope =
    installCut > 200 ? readme.slice(0, installCut) : readme.slice(0, maxChars * 2);

  const withoutCode = scope.replace(/```[\s\S]*?```/g, "\n");
  const lines: string[] = [];

  for (const raw of withoutCode.split("\n")) {
    let t = raw.trim();
    if (!t || t.startsWith("|") || t.startsWith("![")) continue;
    if (/^note:/i.test(t)) continue;
    if (/^important:/i.test(t)) continue;
    if (/^disclaimer:/i.test(t)) continue;
    if (/^\[\s*\]\s*\(/i.test(t)) continue;
    if (/for information about.*see/i.test(t)) continue;
    if (/this repository contains.*implementation/i.test(t)) continue;
    if (t.startsWith("#")) {
      continue;
    }
    t = t
      .replace(/^>\s?/, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\(\s*https?:\/\/[^)]+\)/gi, "")
      .replace(/https?:\/\/[^\s)\]>]+/gi, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .trim();
    if (t && !/^[-*]\s/.test(t)) {
      if (t.length < 12 && !/[.!?]/.test(t)) continue;
      if (/^note:/i.test(t)) continue;
      lines.push(t);
    }
  }

  return lines.join(" ").replace(/\s+/g, " ").slice(0, maxChars);
}

export function toSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

function isAuthorBio(s: string): boolean {
  return (
    /^i('m| am)\s/i.test(s) ||
    /^my agent/i.test(s) ||
    /^i (built|wake)/i.test(s) ||
    /^community contributors/i.test(s) ||
    /^origin story/i.test(s) ||
    /president and ceo/i.test(s) ||
    /146,646 pages/i.test(s) ||
    /i built .+ to run my/i.test(s)
  );
}

function isMetaOrDisclaimer(s: string): boolean {
  return (
    /^note:/i.test(s) ||
    /this repository contains/i.test(s) ||
    /for information about/i.test(s) ||
    /https?:\/\//i.test(s) ||
    /\[\s*\]/.test(s) ||
    /skills\.sh\//i.test(s) ||
    /see agentskills/i.test(s)
  );
}

function isSubstantiveDescription(s: string): boolean {
  const t = s.trim();
  if (t.length < 28) return false;
  if (isMetaOrDisclaimer(t)) return false;
  if (/^[A-Z][\w\s-]{0,50}$/.test(t) && t.split(/\s+/).length <= 4) return false;
  return true;
}

function cleanSummarySentence(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/^([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,3})\s+\1\s+/i, "$1 ")
    .trim();
}

function isCapabilitySentence(s: string): boolean {
  return /search|graph|agent|memory|synthesis|rag|mcp|install|database|api|cli|docker|schema|skill/i.test(
    s,
  );
}

function joinParagraph(sentences: string[]): string {
  return sentences.join(" ").trim();
}

/** Build 1–2 paragraphs explaining what the project does. */
export function heuristicWhatItIs(
  name: string,
  description: string | null,
  readme: string,
): string {
  const prose = extractReadmeProse(readme, 8000);
  const sentences = toSentences(prose)
    .map(cleanSummarySentence)
    .filter((s) => isSubstantiveDescription(s));

  const purpose: string[] = [];
  const desc = description?.trim();
  if (desc && desc.length > 15) {
    const d = desc.replace(/\.$/, "");
    if (!purpose.some((p) => p.includes(d.slice(0, 20)))) {
      purpose.push(`${d}.`);
    }
  }

  for (const s of sentences) {
    if (purpose.length >= 3) break;
    if (isAuthorBio(s)) continue;
    const norm = s.endsWith(".") ? s : `${s}.`;
    if (purpose.some((p) => p.includes(s.slice(0, 35)))) continue;
    if (s.length > 400) continue;
    if (/^install |^have your agent|^never set up|^just want a memory|^then paste this/i.test(s)) {
      continue;
    }
    purpose.push(norm);
  }

  const capability = sentences.filter(
    (s) =>
      isCapabilitySentence(s) &&
      !purpose.some((p) => p.includes(s.slice(0, 35))) &&
      !/install|tutorial|api keys|npm install|bun install/i.test(s),
  );

  const pool = [...purpose, ...capability.map((s) => (s.endsWith(".") ? s : `${s}.`))];
  const unique = [...new Set(pool)];

  if (unique.length >= 2) {
    return polishWhatItIsCopy(
      [
        joinParagraph(unique.slice(0, 2)),
        joinParagraph(unique.slice(2, 4)),
      ]
        .filter((p) => p.length > 40)
        .join("\n\n"),
    );
  }

  if (unique.length === 1) {
    const base = unique[0];
    const extra = sentences.find(
      (s) =>
        !base.includes(s.slice(0, 35)) &&
        isSubstantiveDescription(s) &&
        s.length > 30,
    );
    if (extra) {
      const e = extra.endsWith(".") ? extra : `${extra}.`;
      return polishWhatItIsCopy(`${base}\n\n${e}`);
    }
    return polishWhatItIsCopy(base);
  }

  if (description && description.length > 15) {
    const d = description.trim().replace(/\.$/, "");
    const extra = sentences.find((s) => s.length > 40 && !isMetaOrDisclaimer(s));
    if (extra) {
      const e = extra.endsWith(".") ? extra : `${extra}.`;
      return polishWhatItIsCopy(`${d}.\n\n${e}`);
    }
    return polishWhatItIsCopy(
      `${d}. It is an open-source GitHub project you can browse, install, or contribute to.`,
    );
  }

  return polishWhatItIsCopy(
    `${name} is an open-source project on GitHub. It provides tools and code you can run, extend, or embed in your own workflow.`,
  );
}

function cleanAudienceLine(line: string): string {
  return line
    .replace(/^[-*•]\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/[^\s)\]>]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReadmeSection(readme: string, headingPatterns: RegExp[]): string {
  const lines = readme.split("\n");
  let capturing = false;
  const collected: string[] = [];

  for (const raw of lines) {
    const t = raw.trim();
    if (/^#{1,4}\s/.test(t)) {
      const heading = t.replace(/^#+\s*/, "");
      if (capturing) break;
      if (headingPatterns.some((p) => p.test(heading))) {
        capturing = true;
        continue;
      }
    }
    if (!capturing) continue;
    if (!t || t.startsWith("```") || t.startsWith("![")) continue;
    const cleaned = cleanAudienceLine(t);
    if (cleaned.length < 16) continue;
    if (/^note:/i.test(cleaned)) continue;
    collected.push(cleaned.endsWith(".") ? cleaned : `${cleaned}.`);
    if (collected.length >= 2) break;
  }

  return collected.join(" ").slice(0, 320);
}

function repoAudienceFallbacks(
  name: string,
  description: string | null,
): WhoItsForDetail {
  const desc = description?.trim().replace(/\.$/, "") ?? null;
  return {
    intendedFor: desc
      ? `Anyone evaluating ${name} — ${desc}.`
      : `People deciding whether ${name} fits their project or workflow.`,
    whoShouldUse: desc
      ? `Developers and technical users who would run, integrate, or contribute to ${name}.`
      : `Developers who clone the repo, follow the README setup, and try it against their own use case.`,
    whoItHelps: desc
      ? `Teams that need ${desc.toLowerCase()} without building it from scratch.`
      : `Anyone who wants a maintained open-source option in this space instead of a one-off script.`,
  };
}

/** Pull audience hints from README headings and bullets — repo-specific when present. */
export function extractAudienceFromReadme(
  readme: string,
  name: string,
  description: string | null,
): WhoItsForDetail {
  const fromReadme = {
    intendedFor: extractReadmeSection(readme, [
      /^who\s+is\s+this\s+for\b/i,
      /^intended\s+(for|audience)\b/i,
      /^target\s+audience\b/i,
      /^who\s+it'?s\s+for\b/i,
      /^audience\b/i,
      /^use\s+cases?\b/i,
    ]),
    whoShouldUse: extractReadmeSection(readme, [
      /^who\s+should\s+use\b/i,
      /^getting\s+started\b/i,
      /^quick\s+start\b/i,
      /^for\s+developers\b/i,
      /^prerequisites\b/i,
      /^requirements\b/i,
    ]),
    whoItHelps: extractReadmeSection(readme, [
      /^why\s+use\b/i,
      /^why\s+this\b/i,
      /^benefits?\b/i,
      /^problems?\s+(it\s+)?solves?\b/i,
    ]),
  };
  const inferred = inferAudienceFromProse(readme, name, description);
  const fallbacks = repoAudienceFallbacks(name, description);
  return {
    intendedFor:
      fromReadme.intendedFor || inferred.intendedFor || fallbacks.intendedFor,
    whoShouldUse:
      fromReadme.whoShouldUse || inferred.whoShouldUse || fallbacks.whoShouldUse,
    whoItHelps:
      fromReadme.whoItHelps || inferred.intendedFor || fallbacks.whoItHelps,
  };
}

export function readmeHasAudienceSections(readme: string): boolean {
  return Boolean(
    extractReadmeSection(readme, [/^who\s+is\s+this\s+for\b/i, /^intended\s+for\b/i, /^use\s+cases?\b/i]) ||
      extractReadmeSection(readme, [/^who\s+should\s+use\b/i, /^getting\s+started\b/i]),
  );
}

const GENERIC_AUDIENCE_SNIPPETS = [
  "Open-source users looking for a maintained solution in this problem space",
  "Developers and technical evaluators who clone, install, or fork GitHub projects",
  "Builders and early adopters exploring AI-powered workflows",
  "Technical users who prefer scripts, terminals, and reproducible setup",
  "Developers who want to integrate this project's functionality",
  "Software engineers evaluating whether the API, SDK, or package fits",
  "Anyone deciding in minutes whether a repo is worth a deeper install",
  "Organizations and teams that want a shared, queryable memory layer",
  "People building or operating autonomous AI agents",
];

function inferAudienceFromProse(
  readme: string,
  name: string,
  description: string | null,
): Partial<WhoItsForDetail> {
  const prose = extractReadmeProse(readme, 6000);
  const sentences = toSentences(prose).map(cleanAudienceLine);

  const audienceSentence = sentences.find((s) =>
    /designed for|built for|intended for|perfect for|ideal for|aimed at|target(s|ing)?\s|for developers|for teams|for engineers|who need|who want|who are building/i.test(
      s,
    ),
  );
  const useSentence = sentences.find(
    (s) =>
      /use (this|it) (to|for)|you can use|getting started|install|npm install|yarn add|pip install/i.test(
        s,
      ) && s.length < 280,
  );

  const desc = description?.trim().replace(/\.$/, "") ?? null;
  return {
    intendedFor: audienceSentence
      ? audienceSentence.endsWith(".")
        ? audienceSentence
        : `${audienceSentence}.`
      : desc
        ? `${name} is for teams and developers who need ${desc.toLowerCase()}.`
        : undefined,
    whoShouldUse: useSentence
      ? useSentence.endsWith(".")
        ? useSentence
        : `${useSentence}.`
      : desc
        ? `Pick it up if you are evaluating ${desc.toLowerCase()} and want a maintained open-source option.`
        : undefined,
  };
}

/** One readable blurb for the audience widget. */
export function mergeAudienceCopy(detail: WhoItsForDetail): string {
  const intended = detail.intendedFor?.trim() ?? "";
  const whoUse = detail.whoShouldUse?.trim() ?? "";
  if (!intended && !whoUse) return "";
  if (!whoUse || intended.includes(whoUse.slice(0, 48))) return intended;
  if (!intended) return whoUse;
  const lead = intended.endsWith(".") ? intended : `${intended}.`;
  const tail = whoUse.endsWith(".") ? whoUse : `${whoUse}.`;
  return `${lead} ${tail}`.replace(/\s+/g, " ").slice(0, 440);
}

export function whoItsForLooksGeneric(detail: WhoItsForDetail): boolean {
  const combined = `${detail.intendedFor} ${detail.whoShouldUse} ${detail.whoItHelps}`;
  return GENERIC_AUDIENCE_SNIPPETS.some((s) => combined.includes(s.slice(0, 48)));
}

/** Structured audience breakdown — always repo-specific when name is known. */
export function heuristicWhoItsFor(
  readme: string,
  _category: string,
  name?: string,
  description?: string | null,
): WhoItsForDetail {
  if (name) {
    return extractAudienceFromReadme(readme, name, description ?? null);
  }

  return {
    intendedFor:
      "Open-source users looking for a maintained solution in this problem space.",
    whoShouldUse:
      "Developers and technical evaluators who clone, install, or fork GitHub projects as part of their workflow.",
    whoItHelps:
      "People who want to solve a specific problem without building everything from scratch, and who benefit from community docs, issues, and examples.",
  };
}
