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

/** Structured audience breakdown from README signals. */
export function heuristicWhoItsFor(readme: string, category: string): WhoItsForDetail {
  const team =
    /company brain|team|federated|multi-user|organization|startup|y combinator/i.test(readme);
  const agents =
    /personal agent|your agent|openclaw|hermes|mcp|claude code|codex|cursor|ai agent/i.test(
      readme,
    );
  const devs = /developer|engineer|npm install|pip install|cli|terminal/i.test(readme);
  const library = /library|sdk|import \{|npm install|pip install/i.test(readme);

  if (team && agents) {
    return {
      intendedFor:
        "Organizations and teams that want a shared, queryable memory layer for AI — not separate note dumps per person.",
      whoShouldUse:
        "Engineering leads, founders, and developers who already run AI agents (OpenClaw, Hermes, Claude Code, Codex, Cursor) and want those agents to remember context across meetings, docs, and tools.",
      whoItHelps:
        "Anyone who would otherwise re-read dozens of pages before a meeting, lose thread between chat sessions, or miss connections across email, Slack, and internal docs. It helps teams prepare faster and agents answer with citations instead of guesses.",
    };
  }

  if (agents) {
    return {
      intendedFor:
        "People building or operating autonomous AI agents that need durable memory beyond a single conversation.",
      whoShouldUse:
        "Developers and power users comfortable wiring MCP tools, running local services, and supplying API keys for embeddings and LLMs.",
      whoItHelps:
        "Users tired of copy-pasting context into every chat, re-explaining projects to their agent, or getting keyword search results instead of synthesized answers.",
    };
  }

  if (library) {
    return {
      intendedFor:
        "Developers who want to integrate this project's functionality into an existing application or pipeline.",
      whoShouldUse:
        "Software engineers evaluating whether the API, SDK, or package fits their stack and license requirements.",
      whoItHelps:
        "Teams that would otherwise rebuild the same capability in-house — it offers a maintained open-source starting point they can adopt or fork.",
    };
  }

  if (devs || category === "CLI Tool") {
    return {
      intendedFor:
        "Technical users who prefer scripts, terminals, and reproducible setup over GUI-only tools.",
      whoShouldUse:
        "Developers and DevOps-minded users who read the README, run install commands, and configure environment variables.",
      whoItHelps:
        "People who need automation, self-hosting, or fine-grained control that hosted SaaS products do not provide.",
    };
  }

  if (category === "AI Application") {
    return {
      intendedFor:
        "Builders and early adopters exploring AI-powered workflows and tools.",
      whoShouldUse:
        "Developers, researchers, and product teams prototyping with LLMs who need to understand scope before committing.",
      whoItHelps:
        "Anyone deciding in minutes whether a repo is worth a deeper install — it surfaces purpose, audience, and stack without reading the full codebase.",
    };
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
