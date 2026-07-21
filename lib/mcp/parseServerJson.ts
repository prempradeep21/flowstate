// Tolerant parser for the "paste your MCP config" box. Client-safe, pure.
//
// Accepted shapes:
//   https://mcp.example.com/mcp                       (bare URL)
//   { "url": "https://…", "name"?: …, "headers"?: … }
//   { "mcpServers": { "notion": { "url": "https://…" }, … } }   (Claude Desktop style)
//   [ { "name": …, "url": … }, … ]
// stdio entries (command/args) are recognized but skipped on web builds.

export interface ParsedMcpServer {
  name: string;
  url: string;
  headers?: Record<string, string>;
}

export interface ParseServerResult {
  servers: ParsedMcpServer[];
  /** Count of stdio (command-based) entries that were skipped. */
  skippedStdio: number;
  error?: string;
}

function nameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\.|^mcp\./, "").split(".")[0] || "server";
  } catch {
    return "server";
  }
}

function coerceHeaders(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && key.trim()) out[key.trim()] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function entryToServer(name: string, entry: unknown): ParsedMcpServer | "stdio" | null {
  if (typeof entry === "string") {
    return { name, url: entry };
  }
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.command === "string") return "stdio";
  const url =
    typeof obj.url === "string"
      ? obj.url
      : typeof obj.serverUrl === "string"
        ? obj.serverUrl
        : typeof obj.href === "string"
          ? obj.href
          : null;
  if (!url) return null;
  return {
    name: typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : name,
    url,
    headers: coerceHeaders(obj.headers),
  };
}

export function parseServerInput(raw: string): ParseServerResult {
  const text = raw.trim();
  if (!text) return { servers: [], skippedStdio: 0, error: "Paste a URL or MCP JSON config." };

  // Bare URL
  if (/^https?:\/\//i.test(text) && !text.includes("{")) {
    return { servers: [{ name: nameFromUrl(text), url: text }], skippedStdio: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { servers: [], skippedStdio: 0, error: "Not a valid URL or JSON config." };
  }

  const servers: ParsedMcpServer[] = [];
  let skippedStdio = 0;
  const push = (name: string, entry: unknown) => {
    const result = entryToServer(name, entry);
    if (result === "stdio") skippedStdio += 1;
    else if (result) servers.push(result);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((entry, i) => push(`server-${i + 1}`, entry));
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const mcpServers = obj.mcpServers ?? obj.servers;
    if (mcpServers && typeof mcpServers === "object" && !Array.isArray(mcpServers)) {
      for (const [name, entry] of Object.entries(mcpServers as Record<string, unknown>)) {
        push(name, entry);
      }
    } else {
      push(
        typeof obj.name === "string" && obj.name.trim()
          ? obj.name.trim()
          : typeof obj.url === "string"
            ? nameFromUrl(obj.url)
            : "server",
        obj,
      );
    }
  }

  if (servers.length === 0) {
    return {
      servers,
      skippedStdio,
      error:
        skippedStdio > 0
          ? "This config only contains local (command-based) servers, which aren't supported on the web app yet. Remote servers need a url."
          : "No servers with a url found in that config.",
    };
  }
  return { servers, skippedStdio };
}
