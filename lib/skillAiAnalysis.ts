/**
 * Server-only. Deliberately kept separate from lib/skillMetadata.ts, which
 * lib/skills.ts imports client-side during upload — importing
 * @anthropic-ai/sdk from that shared file would pull it into the browser
 * bundle. Only app/api/skills/analyze/route.ts should import this module.
 */
import Anthropic from "@anthropic-ai/sdk";
import { deriveSkillCardData, type SkillCardData } from "@/lib/skillMetadata";

const SKILL_ANALYSIS_MAX_CHARS = 12_000;

const SKILL_ANALYSIS_JSON_SCHEMA = `{
  "whatItDoes": "1-2 plain-English sentences summarizing what this skill does. No URLs, no markdown.",
  "author": "The person or org who wrote this, ONLY if the file itself states one (e.g. in frontmatter or a byline). Omit the field entirely otherwise — never guess.",
  "tokenCost": "\\"low\\" | \\"medium\\" | \\"high\\" — your judgment of how much context this skill consumes when it loads (short focused skill = low, long skill with lots of reference material = high).",
  "security": "null if the skill is safe/ordinary, otherwise { \\"level\\": \\"flagged\\", \\"note\\": \\"short reason\\" } if it touches destructive commands, credential handling, prompt-injection risk, or broad tool/file-system access.",
  "maturity": { "version": "string or null", "license": "string or null" },
  "compatibility": ["short strings naming frameworks/tools/platforms this skill assumes, if any"],
  "restrictions": ["short strings naming constraints on where/how this skill applies, if any"],
  "topics": ["short lowercase topic tags describing the kind of skill this is, e.g. accessibility, motion, taste, security, testing"]
}`;

/**
 * Reads the *entire* skill file with an LLM to populate the card fields with
 * real judgment (not just frontmatter/keyword matching). Falls back to the
 * heuristic parser on any failure or missing API key — callers always get a
 * usable `SkillCardData` back.
 */
export async function analyzeSkillWithClaude(
  rawText: string,
  fileName: string,
): Promise<SkillCardData> {
  const fallback = deriveSkillCardData(rawText);

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return fallback;

  const truncated = rawText.length > SKILL_ANALYSIS_MAX_CHARS;
  const content = truncated ? rawText.slice(0, SKILL_ANALYSIS_MAX_CHARS) : rawText;

  const userContent = `Skill file: ${fileName}${truncated ? ` (truncated to the first ${SKILL_ANALYSIS_MAX_CHARS} characters)` : ""}

${content}

Read this skill file in full and return strict JSON only matching this schema:
${SKILL_ANALYSIS_JSON_SCHEMA}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system:
        "You analyze Claude Code skill files (markdown, often with YAML frontmatter) for a card preview. Return only valid JSON, no markdown fences, no commentary.",
      messages: [{ role: "user", content: userContent }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return fallback;

    const parsed = JSON.parse(block.text.trim()) as Partial<SkillCardData>;
    if (!parsed.whatItDoes?.trim()) return fallback;

    return {
      whatItDoes: parsed.whatItDoes.trim(),
      author:
        typeof parsed.author === "string" && parsed.author.trim()
          ? parsed.author.trim()
          : undefined,
      tokenCost:
        parsed.tokenCost === "low" ||
        parsed.tokenCost === "medium" ||
        parsed.tokenCost === "high"
          ? parsed.tokenCost
          : fallback.tokenCost,
      security:
        parsed.security && typeof parsed.security === "object" && "note" in parsed.security
          ? { level: "flagged", note: String((parsed.security as { note: unknown }).note) }
          : null,
      maturity: {
        version: parsed.maturity?.version ?? fallback.maturity.version,
        license: parsed.maturity?.license ?? fallback.maturity.license,
      },
      compatibility: Array.isArray(parsed.compatibility)
        ? parsed.compatibility.slice(0, 8)
        : fallback.compatibility,
      restrictions: Array.isArray(parsed.restrictions)
        ? parsed.restrictions.slice(0, 8)
        : fallback.restrictions,
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 8) : fallback.topics,
    };
  } catch {
    return fallback;
  }
}
