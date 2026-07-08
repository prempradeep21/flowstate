/** Anthropic server-side web search tool (not a client tool with input_schema). */

const DEFAULT_MAX_USES = 2;
const MAX_PAUSE_TURNS = 8;

export function getAnthropicWebSearchMaxUses(): number {
  const raw = process.env.ANTHROPIC_WEB_SEARCH_MAX_USES?.trim();
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
  }
  return DEFAULT_MAX_USES;
}

export function getMaxPauseTurns(): number {
  return MAX_PAUSE_TURNS;
}

export function buildWebSearchTool() {
  return {
    type: "web_search_20250305" as const,
    name: "web_search" as const,
    max_uses: getAnthropicWebSearchMaxUses(),
  };
}

/** @deprecated Use buildWebSearchTool() for env-aware max_uses. */
export const WEB_SEARCH_TOOL = buildWebSearchTool();

export function isAnthropicWebSearchEnabled(): boolean {
  const flag = process.env.ANTHROPIC_WEB_SEARCH_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
