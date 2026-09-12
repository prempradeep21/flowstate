-- First-party anonymous visitor telemetry for the Usage Analysis dashboard.
-- Captures page views from logged-out (and logged-in) visitors so we can see
-- how many unique people arrive, where in the world they are, and what source
-- (subreddit, search, direct) sent them. No raw IP is ever stored — geo comes
-- from Vercel edge headers and the visitor id is a random first-party cookie.

create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Random first-party cookie id (fs_vid). Rotates when the cookie is cleared;
  -- used only to approximate unique-visitor counts, not to identify people.
  visitor_id text not null,
  path text,
  is_authenticated boolean not null default false,
  referrer_host text,          -- e.g. "reddit.com"
  source text,                 -- derived label: "Reddit", "Google", "Direct", …
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,                -- ISO-3166 alpha-2 from x-vercel-ip-country
  region text,                 -- subdivision code from x-vercel-ip-country-region
  city text,                   -- from x-vercel-ip-city (best effort)
  world_region text            -- continent bucket derived from country
);

create index if not exists visitor_events_created_at_idx
  on public.visitor_events (created_at desc);

create index if not exists visitor_events_visitor_idx
  on public.visitor_events (visitor_id, created_at desc);

create index if not exists visitor_events_anon_idx
  on public.visitor_events (is_authenticated, created_at desc);

alter table public.visitor_events enable row level security;

-- No public policies: writes and reads go through the service role only, the
-- same pattern as usage_analysis_snapshots and qa_turn_events.
revoke all on table public.visitor_events from anon, authenticated;
