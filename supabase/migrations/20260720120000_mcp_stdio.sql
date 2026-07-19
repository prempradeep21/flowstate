-- Local (stdio) MCP servers. Additive columns on mcp_servers; the transport
-- check already allows 'stdio'. These only execute in the desktop app (or
-- local dev) — a hosted web build never spawns processes from them.
alter table public.mcp_servers
  add column if not exists stdio_command text,
  add column if not exists stdio_args jsonb,
  -- AES-256-GCM blob of the env-var map (may contain API keys).
  add column if not exists stdio_env_encrypted text;
