import Anthropic from "@anthropic-ai/sdk";
import { inferCategory } from "@/lib/github/stackDetect";
import type { OverviewAi, WhoItsForDetail } from "@/lib/github/types";
import { polishWhatItIsCopy } from "@/lib/github/overviewCopyLimits";
import {
  extractReadmeProse,
  heuristicWhatItIs,
  heuristicWhoItsFor,
} from "@/lib/github/readmeSummary";

export interface OverviewAiInput {
  name: string;
  fullName: string;
  description: string | null;
  readme: string;
  deps: string[];
  topics: string[];
  language: string | null;
  license: string | null;
}

function buildHeuristicOverview(input: OverviewAiInput): OverviewAi {
  const category = inferCategory(input.description, input.deps);
  const tags = [
    ...input.topics.slice(0, 4),
    input.language ?? "",
    input.license ?? "",
    category.includes("AI") ? "LLM" : "",
    "Open Source",
  ].filter(Boolean);

  const keyFeatures: string[] = [];
  const { readme } = input;
  if (/hybrid|rag|search|retriev/i.test(readme)) {
    keyFeatures.push("Hybrid search that returns answers, not just document lists");
  }
  if (/knowledge graph|graph/i.test(readme)) {
    keyFeatures.push("Knowledge graph that links entities automatically");
  }
  if (/mcp|agent|openclaw|hermes/i.test(readme)) {
    keyFeatures.push("Installs through AI agent platforms (MCP, OpenClaw, Hermes)");
  }
  if (/docker|compose/i.test(readme)) {
    keyFeatures.push("Docker-based deployment option");
  }
  if (/api|sdk|library/i.test(readme) && keyFeatures.length < 3) {
    keyFeatures.push("Usable as a library or API in other projects");
  }
  while (keyFeatures.length < 3) {
    const fallbacks = [
      "Open-source and self-hostable",
      "Documented setup path in the README",
      "Active GitHub community",
    ];
    for (const f of fallbacks) {
      if (!keyFeatures.includes(f) && keyFeatures.length < 3) keyFeatures.push(f);
    }
    break;
  }

  return {
    category,
    tags: [...new Set(tags)].slice(0, 8),
    whatItIs: polishWhatItIsCopy(heuristicWhatItIs(input.name, input.description, readme)),
    whoItsFor: heuristicWhoItsFor(readme, category),
    keyFeatures: keyFeatures.slice(0, 3),
  };
}

const OVERVIEW_JSON_SCHEMA = `{
  "whatItIs": "Exactly 2 short paragraphs (~60-110 words total, ~55 words max each). ≤2 sentences per paragraph. Paragraph 1: what the project is. Paragraph 2: how it works / key capabilities. Separate with \\\\n\\\\n. Plain English only — NO URLs, NO markdown, NO 'Note:' or disclaimers, NO 'see X for details', NO link text.",
  "whoItsFor": {
    "intendedFor": "1-2 sentences: who this repository is intended for",
    "whoShouldUse": "1-2 sentences: who is supposed to use it in practice",
    "whoItHelps": "1-2 sentences: who will benefit and what problem it solves for them"
  },
  "category": "short label e.g. AI Application, CLI Tool",
  "tags": ["up to 6 short tags"],
  "keyFeatures": ["exactly 3 concrete capabilities"]
}`;

function parseWhoItsFor(raw: unknown, fallback: WhoItsForDetail): WhoItsForDetail {
  if (typeof raw === "string" && raw.trim()) {
    return {
      intendedFor: raw.trim(),
      whoShouldUse: fallback.whoShouldUse,
      whoItHelps: fallback.whoItHelps,
    };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      intendedFor:
        typeof o.intendedFor === "string" && o.intendedFor.trim()
          ? o.intendedFor.trim()
          : fallback.intendedFor,
      whoShouldUse:
        typeof o.whoShouldUse === "string" && o.whoShouldUse.trim()
          ? o.whoShouldUse.trim()
          : fallback.whoShouldUse,
      whoItHelps:
        typeof o.whoItHelps === "string" && o.whoItHelps.trim()
          ? o.whoItHelps.trim()
          : fallback.whoItHelps,
    };
  }
  return fallback;
}

async function generateWithClaude(input: OverviewAiInput): Promise<OverviewAi | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const prose = extractReadmeProse(input.readme, 6000);
  const userContent = `Repository: ${input.fullName}
GitHub description: ${input.description ?? "(none)"}
Primary language: ${input.language ?? "unknown"}
Topics: ${input.topics.join(", ") || "(none)"}
Notable dependencies: ${input.deps.slice(0, 30).join(", ") || "(none)"}

README excerpt:
${prose}

Write for someone evaluating this repo in under 2 minutes.
The "whatItIs" field must read like a human wrote it for a friend — a clear summary of what the repo does.
Never paste README text. Never include URLs, domains, "Note:", disclaimers, or "see … for details".
Return strict JSON only matching this schema:
${OVERVIEW_JSON_SCHEMA}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:
        "You explain GitHub repositories in clear, simple English for rapid evaluation. Write original summaries — never copy README wording with links or notes. Return only valid JSON, no markdown fences.",
      messages: [{ role: "user", content: userContent }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const parsed = JSON.parse(block.text.trim()) as Partial<
      OverviewAi & { whoItsFor?: unknown }
    >;
    if (!parsed.whatItIs?.trim()) return null;

    const heuristic = buildHeuristicOverview(input);
    const whoItsFor = parseWhoItsFor(parsed.whoItsFor, heuristic.whoItsFor);

    return {
      category: parsed.category?.trim() || heuristic.category,
      tags:
        Array.isArray(parsed.tags) && parsed.tags.length
          ? parsed.tags.slice(0, 8)
          : heuristic.tags,
      whatItIs: polishWhatItIsCopy(parsed.whatItIs.trim()),
      whoItsFor,
      keyFeatures:
        Array.isArray(parsed.keyFeatures) && parsed.keyFeatures.length >= 3
          ? parsed.keyFeatures.slice(0, 3)
          : heuristic.keyFeatures,
    };
  } catch {
    return null;
  }
}

export async function generateOverviewAi(input: OverviewAiInput): Promise<OverviewAi> {
  const fromClaude = await generateWithClaude(input);
  if (fromClaude) return fromClaude;
  return buildHeuristicOverview(input);
}
