"use client";

// MCP console: manage per-user MCP servers — add via registry search or
// pasted URL/JSON, view tools + remembered permissions, connect OAuth
// servers, enable/disable, delete. Servers are private to the signed-in user.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { parseServerInput, type ParsedMcpServer } from "@/lib/mcp/parseServerJson";
import { isStdioMcpAllowed } from "@/lib/supabase/environment";
import type { McpServerSummary } from "@/lib/mcp/types";

interface RegistryEntry {
  name: string;
  description: string;
  remotes: Array<{ type: string; url: string }>;
}

/** Payload sent to POST /api/mcp/servers (remote or local). */
type AddServerPayload = ParsedMcpServer & { transport?: "http" | "stdio" };

export function McpSection() {
  const { user, signInWithGoogle } = useAuth();
  const [servers, setServers] = useState<McpServerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/servers");
      if (!res.ok) {
        if (res.status !== 401) setError("Could not load MCP servers.");
        setServers([]);
        return;
      }
      const data = (await res.json()) as { servers: McpServerSummary[] };
      setServers(data.servers);
      setError(null);
    } catch {
      setError("Could not load MCP servers.");
      setServers([]);
    }
  }, []);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  // OAuth popup completion → refresh the list.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === "mcp-oauth-complete") void refresh();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refresh]);

  if (!user) {
    return (
      <section className="px-5 py-6 text-center">
        <p className="text-canvas-body text-canvas-muted/80">
          Sign in to connect MCP servers — external tools Flowstate can use in
          your chats.
        </p>
        <button
          type="button"
          className="btn mt-3 rounded-full bg-canvas-accent px-4 py-1.5 text-sm font-medium text-white"
          onClick={() => void signInWithGoogle()}
        >
          Sign in
        </button>
      </section>
    );
  }

  return (
    <section className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold leading-snug text-canvas-ink" style={{ fontSize: "20.8px" }}>
          MCP servers
        </h3>
        <button
          type="button"
          className="btn rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white"
          onClick={() => setAddOpen((v) => !v)}
        >
          {addOpen ? "Close" : "Add server"}
        </button>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-canvas-muted">
        Connected tools are available in every chat on your canvases. Each tool
        asks for your permission on first use.
      </p>

      {addOpen ? <McpAddServer onAdded={() => void refresh()} /> : null}
      {error ? <p className="mb-3 text-xs text-red-500">{error}</p> : null}

      {servers === null ? (
        <p className="text-center text-canvas-body text-canvas-muted/80">Loading…</p>
      ) : servers.length === 0 && !addOpen ? (
        <p className="text-center text-canvas-body text-canvas-muted/80">
          No MCP servers yet. Add one to give Flowstate new tools.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {servers.map((server) => (
            <McpServerRow key={server.id} server={server} onChanged={() => void refresh()} />
          ))}
        </div>
      )}
    </section>
  );
}

function McpServerRow({
  server,
  onChanged,
}: {
  server: McpServerSummary;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusDot =
    server.lastStatus === "connected"
      ? "bg-emerald-500"
      : server.lastStatus === "needs-auth"
        ? "bg-amber-500"
        : server.lastStatus === "error"
          ? "bg-red-500"
          : "bg-canvas-muted/40";

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await fetch(`/api/mcp/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove "${server.name}" and its saved permissions?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/mcp/servers/${server.id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/mcp/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: server.id }),
      });
      const data = (await res.json()) as { authorizationUrl?: string; connected?: boolean; error?: string };
      if (data.authorizationUrl) {
        window.open(data.authorizationUrl, "mcp-oauth", "width=600,height=740");
      } else if (data.connected) {
        onChanged();
      } else if (data.error) {
        window.alert(`Connection failed: ${data.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const refreshTools = async () => {
    setBusy(true);
    try {
      await fetch(`/api/mcp/servers/${server.id}/tools?refresh=1`);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const revokeGrant = async (toolName: string) => {
    await fetch("/api/mcp/grants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: server.id, toolName }),
    });
    onChanged();
  };

  return (
    <div className="rounded-canvas border border-canvas-border bg-canvas-card p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
        <button
          type="button"
          className="btn min-w-0 flex-1 truncate text-left text-sm font-medium text-canvas-ink"
          onClick={() => setExpanded((v) => !v)}
          title={server.url ?? undefined}
        >
          {server.name}
          <span className="ml-2 text-xs font-normal text-canvas-muted">
            {server.tools.length} tool{server.tools.length === 1 ? "" : "s"}
          </span>
        </button>
        <label className="flex cursor-pointer items-center gap-1 text-xs text-canvas-muted">
          <input
            type="checkbox"
            checked={server.enabled}
            disabled={busy}
            onChange={(e) => void patch({ enabled: e.target.checked })}
          />
          On
        </label>
      </div>

      {server.lastStatus === "needs-auth" ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
          <p className="min-w-0 flex-1 text-xs text-canvas-muted">
            {server.oauthConnected ? "Session expired — reconnect." : "This server requires sign-in."}
          </p>
          <button
            type="button"
            disabled={busy}
            className="btn shrink-0 rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            onClick={() => void connect()}
          >
            Connect
          </button>
        </div>
      ) : server.lastStatus === "error" && server.lastError ? (
        <p className="mt-2 line-clamp-2 text-xs text-red-500">{server.lastError}</p>
      ) : null}

      {expanded ? (
        <div className="mt-2 border-t border-canvas-border pt-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-canvas-muted">Tools</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                className="btn text-xs text-canvas-accent disabled:opacity-50"
                onClick={() => void refreshTools()}
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={busy}
                className="btn text-xs text-red-500 disabled:opacity-50"
                onClick={() => void remove()}
              >
                Remove
              </button>
            </div>
          </div>
          {server.tools.length === 0 ? (
            <p className="text-xs text-canvas-muted/80">No tools listed yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {server.tools.map((tool) => (
                <li key={tool.name} className="flex items-start gap-2 text-xs">
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-canvas-ink">{tool.name}</span>
                    {tool.description ? (
                      <span className="ml-1 text-canvas-muted/80">
                        — {tool.description.slice(0, 90)}
                      </span>
                    ) : null}
                  </span>
                  {tool.grantStatus === "always" ? (
                    <button
                      type="button"
                      className="btn shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600"
                      title="Click to revoke"
                      onClick={() => void revokeGrant(tool.name)}
                    >
                      Always allowed ×
                    </button>
                  ) : tool.grantStatus === "deny" ? (
                    <button
                      type="button"
                      className="btn shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500"
                      title="Click to clear"
                      onClick={() => void revokeGrant(tool.name)}
                    >
                      Denied ×
                    </button>
                  ) : tool.grantStatus === "stale-hash" ? (
                    <span
                      className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600"
                      title="This tool changed since you approved it — it will ask again."
                    >
                      Changed
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function McpAddServer({ onAdded }: { onAdded: () => void }) {
  const stdioAllowed = isStdioMcpAllowed();
  const [mode, setMode] = useState<"search" | "paste" | "local">("search");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addServer = async (payload: AddServerPayload): Promise<boolean> => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        server?: { status: string; toolCount: number; error?: string | null };
        error?: string;
      };
      if (!res.ok || data.error) {
        setMessage(data.error ?? "Failed to add server.");
        return false;
      }
      const status = data.server?.status;
      setMessage(
        status === "connected"
          ? `Connected — ${data.server?.toolCount ?? 0} tools available.`
          : status === "needs-auth"
            ? "Added. This server needs authentication — use Connect."
            : `Added, but the first connection failed: ${data.server?.error ?? "unknown error"}`,
      );
      onAdded();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const tabs: Array<{ id: typeof mode; label: string }> = [
    { id: "search", label: "Browse registry" },
    { id: "paste", label: "Paste URL / JSON" },
    ...(stdioAllowed ? [{ id: "local" as const, label: "Local command" }] : []),
  ];

  return (
    <div className="mb-4 rounded-canvas border border-canvas-border bg-canvas-bg/60 p-3">
      <div className="mb-2 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn rounded-full px-3 py-1 text-xs font-medium ${
              mode === t.id ? "bg-canvas-accent text-white" : "text-canvas-muted"
            }`}
            onClick={() => setMode(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {mode === "search" ? (
        <McpRegistrySearch
          busy={busy}
          onPick={(entry) =>
            void addServer({
              name: entry.name.split("/").pop() ?? entry.name,
              url: entry.remotes[0]!.url,
            })
          }
        />
      ) : mode === "paste" ? (
        <McpPasteForm busy={busy} allowStdio={stdioAllowed} onSubmit={addServer} />
      ) : (
        <McpStdioForm busy={busy} onSubmit={addServer} />
      )}
      {message ? <p className="mt-2 text-xs text-canvas-muted">{message}</p> : null}
    </div>
  );
}

function McpRegistrySearch({
  busy,
  onPick,
}: {
  busy: boolean;
  onPick: (entry: RegistryEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistryEntry[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/mcp/registry?q=${encodeURIComponent(q)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { servers: RegistryEntry[] };
          setResults(data.servers);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the MCP registry (e.g. github, weather)…"
        className="w-full rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 text-sm text-canvas-ink outline-none placeholder:text-canvas-muted/60"
      />
      {searching ? (
        <p className="mt-2 text-xs text-canvas-muted/80">Searching…</p>
      ) : results === null ? (
        <p className="mt-2 text-xs text-canvas-muted/60">
          Results come from the official MCP registry. Only servers with a
          remote endpoint can be used here.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-2 text-xs text-canvas-muted/80">No remote-capable servers found.</p>
      ) : (
        <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
          {results.map((entry) => (
            <li
              key={entry.name}
              className="flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-card px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-canvas-ink">{entry.name}</p>
                <p className="line-clamp-1 text-[11px] text-canvas-muted/80">
                  {entry.description || entry.remotes[0]?.url}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                className="btn shrink-0 rounded-full bg-canvas-accent px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                onClick={() => onPick(entry)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function McpPasteForm({
  busy,
  allowStdio,
  onSubmit,
}: {
  busy: boolean;
  allowStdio: boolean;
  onSubmit: (payload: AddServerPayload) => Promise<boolean>;
}) {
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const submit = async () => {
    const parsed = parseServerInput(raw, allowStdio);
    if (parsed.error || parsed.servers.length === 0) {
      setParseError(parsed.error ?? "No servers found in that config.");
      return;
    }
    setParseError(
      parsed.skippedStdio > 0
        ? `${parsed.skippedStdio} local (command-based) server(s) skipped — only available in the desktop app.`
        : null,
    );
    for (const server of parsed.servers) {
      const ok = await onSubmit({
        ...server,
        transport: server.command ? "stdio" : "http",
      });
      if (!ok) break;
    }
    setRaw("");
  };

  return (
    <div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={4}
        placeholder={'https://mcp.example.com/mcp\nor JSON: { "mcpServers": { "notion": { "url": "https://mcp.notion.com/mcp" } } }'}
        className="w-full resize-y rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 font-mono text-xs text-canvas-ink outline-none placeholder:text-canvas-muted/50"
      />
      {parseError ? <p className="mt-1 text-xs text-amber-600">{parseError}</p> : null}
      <button
        type="button"
        disabled={busy || !raw.trim()}
        className="btn mt-2 rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        onClick={() => void submit()}
      >
        Add server{raw.includes("mcpServers") ? "s" : ""}
      </button>
    </div>
  );
}

function McpStdioForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (payload: AddServerPayload) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [argsText, setArgsText] = useState("");
  const [envText, setEnvText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !command.trim()) {
      setError("Name and command are required.");
      return;
    }
    setError(null);
    // Args: whitespace-separated, honoring simple quotes.
    const args = (argsText.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((a) =>
      a.replace(/^["']|["']$/g, ""),
    );
    // Env: KEY=value lines.
    const env: Record<string, string> = {};
    for (const line of envText.split("\n")) {
      const eq = line.indexOf("=");
      if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
    const ok = await onSubmit({
      name: name.trim(),
      transport: "stdio",
      command: command.trim(),
      args,
      env: Object.keys(env).length > 0 ? env : undefined,
    });
    if (ok) {
      setName("");
      setCommand("");
      setArgsText("");
      setEnvText("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-canvas-muted">
        ⚠️ A local server runs this command <strong>on your machine</strong> with
        your permissions. Only add commands you trust.
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. pollinations)"
        className="w-full rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 text-sm text-canvas-ink outline-none placeholder:text-canvas-muted/60"
      />
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Command (e.g. npx)"
        className="w-full rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 font-mono text-xs text-canvas-ink outline-none placeholder:text-canvas-muted/60"
      />
      <input
        type="text"
        value={argsText}
        onChange={(e) => setArgsText(e.target.value)}
        placeholder="Args (e.g. -y @pollinations/mcp)"
        className="w-full rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 font-mono text-xs text-canvas-ink outline-none placeholder:text-canvas-muted/60"
      />
      <textarea
        value={envText}
        onChange={(e) => setEnvText(e.target.value)}
        rows={2}
        placeholder="Env vars, one per line (KEY=value) — optional"
        className="w-full resize-y rounded-lg border border-canvas-border bg-canvas-card px-3 py-2 font-mono text-xs text-canvas-ink outline-none placeholder:text-canvas-muted/50"
      />
      {error ? <p className="text-xs text-amber-600">{error}</p> : null}
      <button
        type="button"
        disabled={busy || !name.trim() || !command.trim()}
        className="btn self-start rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        onClick={() => void submit()}
      >
        Add local server
      </button>
    </div>
  );
}
