/** Anthropic server-side web search tool (not a client tool with input_schema). */
export const WEB_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 5,
};

export function isAnthropicWebSearchEnabled(): boolean {
  const flag = process.env.ANTHROPIC_WEB_SEARCH_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
