// Tool-name namespacing: MCP tool names from different servers share one flat
// namespace in the LLM tool list. Exposed names are `mcp__{serverSlug}__{tool}`,
// capped at 64 chars (OpenAI-style function-name limit on the OpenRouter path;
// Anthropic allows 128, so 64 is the binding constraint). Pure — unit-tested.

export const MAX_EXPOSED_TOOL_NAME = 64;

function sanitize(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Short stable non-crypto hash (djb2) for truncation disambiguation. */
function shortHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).slice(0, 5);
}

export function slugifyServerName(name: string): string {
  const slug = sanitize(name).toLowerCase().slice(0, 20).replace(/_+$/, "");
  return slug || "server";
}

/**
 * Build a unique exposed name for a tool and record it in `taken`.
 * Truncation appends a short hash of the full original identity so two long
 * names that share a prefix stay distinct.
 */
export function buildExposedName(
  serverSlug: string,
  toolName: string,
  taken: Set<string>,
): string {
  const base = `mcp__${serverSlug}__${sanitize(toolName) || "tool"}`;
  let candidate = base;
  if (candidate.length > MAX_EXPOSED_TOOL_NAME) {
    const suffix = `_${shortHash(`${serverSlug}/${toolName}`)}`;
    candidate = base.slice(0, MAX_EXPOSED_TOOL_NAME - suffix.length) + suffix;
  }
  let unique = candidate;
  let counter = 2;
  while (taken.has(unique)) {
    const suffix = `_${counter}`;
    unique =
      candidate.length + suffix.length > MAX_EXPOSED_TOOL_NAME
        ? candidate.slice(0, MAX_EXPOSED_TOOL_NAME - suffix.length) + suffix
        : candidate + suffix;
    counter += 1;
  }
  taken.add(unique);
  return unique;
}

export function isMcpToolName(name: string): boolean {
  return name.startsWith("mcp__");
}
