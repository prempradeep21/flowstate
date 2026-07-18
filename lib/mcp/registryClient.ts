// Search the official MCP registry (registry.modelcontextprotocol.io).
// Unauthenticated public API, proxied through our route (CORS + normalization).

export interface RegistryServerEntry {
  name: string;
  description: string;
  /** Remote endpoints usable from the web app. */
  remotes: Array<{ type: string; url: string }>;
  version: string | null;
}

const REGISTRY_BASE = "https://registry.modelcontextprotocol.io";
const FETCH_TIMEOUT_MS = 8_000;

interface RawRegistryResponse {
  servers?: Array<Record<string, unknown>>;
  metadata?: { nextCursor?: string };
}

function normalizeEntry(raw: Record<string, unknown>): RegistryServerEntry | null {
  // Entries may nest the definition under `server` (registry _meta wrapper).
  const server = (raw.server && typeof raw.server === "object" ? raw.server : raw) as Record<
    string,
    unknown
  >;
  const name = typeof server.name === "string" ? server.name : null;
  if (!name) return null;
  const description =
    typeof server.description === "string" ? server.description.slice(0, 300) : "";
  const remotesRaw = Array.isArray(server.remotes) ? server.remotes : [];
  const remotes = remotesRaw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const remote = r as Record<string, unknown>;
      const type = typeof remote.type === "string" ? remote.type : "";
      const url = typeof remote.url === "string" ? remote.url : "";
      if (!url || !/^https:\/\//i.test(url)) return null;
      return { type, url };
    })
    .filter((r): r is { type: string; url: string } => r !== null);
  const version =
    typeof server.version === "string"
      ? server.version
      : typeof (server.version_detail as Record<string, unknown> | undefined)?.version === "string"
        ? ((server.version_detail as Record<string, unknown>).version as string)
        : null;
  return { name, description, remotes, version };
}

export async function searchRegistry(options: {
  query?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ servers: RegistryServerEntry[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (options.query?.trim()) params.set("search", options.query.trim());
  if (options.cursor) params.set("cursor", options.cursor);
  params.set("limit", String(Math.min(options.limit ?? 30, 50)));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${REGISTRY_BASE}/v0/servers?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Registry responded ${res.status}`);
    }
    const data = (await res.json()) as RawRegistryResponse;
    const servers = (data.servers ?? [])
      .map(normalizeEntry)
      .filter((entry): entry is RegistryServerEntry => entry !== null);
    return { servers, nextCursor: data.metadata?.nextCursor ?? null };
  } finally {
    clearTimeout(timer);
  }
}
