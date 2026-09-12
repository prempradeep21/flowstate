-- MCP (Model Context Protocol) support: per-user servers, OAuth connections,
-- remembered tool grants, and mid-turn approval requests.
-- All tables are owner-only via RLS; no service-role access is needed.

create table if not exists public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  transport text not null default 'http' check (transport in ('http', 'stdio')),
  url text,
  auth_type text not null default 'none' check (auth_type in ('none', 'headers', 'oauth')),
  -- AES-256-GCM blob of the whole header map (may contain API keys).
  headers_encrypted text,
  -- Cached tool list so chat requests never open MCP connections at
  -- prompt-build time. Refreshed when older than the cache TTL or on demand.
  tools_cache jsonb,
  tools_cached_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.mcp_oauth_connections (
  server_id uuid primary key references public.mcp_servers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  -- Dynamic client registration result (client id/secret) as encrypted JSON.
  client_info_encrypted text,
  -- PKCE verifier + state must survive the start -> callback request pair.
  code_verifier_encrypted text,
  oauth_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mcp_tool_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id uuid not null references public.mcp_servers(id) on delete cascade,
  tool_name text not null,
  decision text not null check (decision in ('always', 'deny')),
  -- sha256 of name + description + inputSchema; a mismatch invalidates the
  -- grant so a server can't silently swap a tool's behavior (rug-pull).
  tool_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, server_id, tool_name)
);

create table if not exists public.mcp_approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id uuid not null references public.mcp_servers(id) on delete cascade,
  tool_name text not null,
  input_preview jsonb,
  tool_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'allow_once', 'always', 'deny', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists mcp_approval_requests_user_pending
  on public.mcp_approval_requests (user_id, status, created_at);

drop trigger if exists mcp_servers_updated_at on public.mcp_servers;
create trigger mcp_servers_updated_at
  before update on public.mcp_servers
  for each row execute function public.set_updated_at();

drop trigger if exists mcp_oauth_connections_updated_at on public.mcp_oauth_connections;
create trigger mcp_oauth_connections_updated_at
  before update on public.mcp_oauth_connections
  for each row execute function public.set_updated_at();

drop trigger if exists mcp_tool_grants_updated_at on public.mcp_tool_grants;
create trigger mcp_tool_grants_updated_at
  before update on public.mcp_tool_grants
  for each row execute function public.set_updated_at();

alter table public.mcp_servers enable row level security;
alter table public.mcp_oauth_connections enable row level security;
alter table public.mcp_tool_grants enable row level security;
alter table public.mcp_approval_requests enable row level security;

drop policy if exists "Users manage own mcp servers" on public.mcp_servers;
create policy "Users manage own mcp servers"
  on public.mcp_servers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own mcp oauth" on public.mcp_oauth_connections;
create policy "Users manage own mcp oauth"
  on public.mcp_oauth_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own mcp grants" on public.mcp_tool_grants;
create policy "Users manage own mcp grants"
  on public.mcp_tool_grants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own mcp approvals" on public.mcp_approval_requests;
create policy "Users manage own mcp approvals"
  on public.mcp_approval_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
