-- Per-owner credit metering: the ledger, the counters, and entitlements.
--
-- Phase 1 uses ONLY usage_ledger and usage_counters, and only to RECORD. No
-- limit is checked and nothing is refused. user_entitlements exists so the
-- admin view can show who is on what and so the shape is settled; the guest
-- and webhook tables are created now for the same reason and stay unused
-- until Phases 4 and 5.
--
-- Owner == auth user today. owner_type exists so an organisation can become
-- the billing subject later without touching a single call site; the swap is
-- lib/billing/owner.ts plus the RLS predicates below.

-- ---------- entitlements: one row per billing owner ----------
create table if not exists public.user_entitlements (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  owner_type text not null default 'user' check (owner_type in ('user', 'org')),

  plan_id text not null default 'free',
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'paused')),

  -- SNAPSHOT of the catalog allowance at grant time. Enforcement reads this,
  -- never the TypeScript catalog, so lowering the free tier later never
  -- retroactively cuts off an existing user.
  credits_per_period numeric(12, 4) not null default 0,
  -- Manual/promo top-ups. Apply to the CURRENT period only; never carried over.
  bonus_credits numeric(12, 4) not null default 0,

  period_start timestamptz not null default date_trunc('day', now()),
  period_end timestamptz not null default (date_trunc('day', now()) + interval '1 month'),

  -- Scheduled changes, applied at the period boundary (never mid-cycle).
  cancel_at_period_end boolean not null default false,
  pending_plan_id text,
  pending_effective_at timestamptz,

  -- The ONLY place a payment provider's identifiers may appear in this schema.
  provider text not null default 'none',
  provider_customer_id text,
  provider_subscription_id text,
  provider_price_id text,

  grace_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_entitlements_provider_sub_idx
  on public.user_entitlements (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists user_entitlements_period_end_idx
  on public.user_entitlements (period_end);

drop trigger if exists user_entitlements_updated_at on public.user_entitlements;
create trigger user_entitlements_updated_at
  before update on public.user_entitlements
  for each row execute function public.set_updated_at();

-- ---------- usage_counters: the fast-read rollup, one row per period ----------
-- In Phase 3 this row is the lock target that serialises concurrent requests
-- for a single owner. In Phase 1 it is just a running total.
create table if not exists public.usage_counters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  credits_used numeric(14, 4) not null default 0,     -- settled
  credits_reserved numeric(14, 4) not null default 0, -- open holds (Phase 3)
  cost_usd numeric(14, 6) not null default 0,         -- modelled raw cost
  events integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_id, period_start)
);

-- ---------- usage_ledger: append-only, one row per metered event ----------
-- Truth. usage_counters is only a cache of this. Raw provider facts are stored
-- alongside the derived credits so the whole table can be recomputed if the
-- pricing formula turns out wrong — hence pricing_version on every row.
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  owner_id uuid references auth.users(id) on delete cascade,
  visitor_id text,  -- guest path (fs_vid cookie); owner_id is null then
  period_start timestamptz not null,

  kind text not null check (kind in ('hold', 'settle', 'refund', 'grant', 'adjustment', 'record')),
  hold_id uuid references public.usage_ledger(id) on delete set null,
  credits numeric(12, 4) not null,  -- SIGNED; sum over a period == credits_used

  -- Raw metered facts. Never derived, so credits can be recomputed later.
  surface text not null,  -- 'chat' | 'custom-ui' | 'quick-explain' | ...
  provider text,          -- 'anthropic' | 'openrouter' | 'cursor' | 'tavily'
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_creation_tokens int not null default 0,
  web_searches int not null default 0,
  units numeric(12, 4) not null default 0,  -- non-token unit (cursor runs, etc.)
  duration_ms int,

  cost_usd numeric(12, 6),
  pricing_version text not null,

  canvas_id uuid references public.canvases(id) on delete set null,
  card_id text,
  outcome text check (outcome in ('success', 'error', 'timeout', 'cancelled', 'pending')),
  expires_at timestamptz,  -- holds only; swept if never settled (Phase 3)
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists usage_ledger_owner_period_idx
  on public.usage_ledger (owner_id, period_start, created_at desc);
create index if not exists usage_ledger_created_at_idx
  on public.usage_ledger (created_at desc);
create index if not exists usage_ledger_surface_idx
  on public.usage_ledger (surface, created_at desc);
create index if not exists usage_ledger_open_holds_idx
  on public.usage_ledger (expires_at)
  where kind = 'hold' and outcome = 'pending';
create index if not exists usage_ledger_visitor_idx
  on public.usage_ledger (visitor_id, created_at desc)
  where visitor_id is not null;

-- ---------- billing_events: webhook idempotency + manual-change audit ----------
-- The unique constraint is the ONLY thing standing between you and a replayed
-- webhook granting a plan twice. Providers retry aggressively and out of order.
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  type text,
  owner_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, event_id)
);

create index if not exists billing_events_unprocessed_idx
  on public.billing_events (received_at desc) where processed_at is null;

-- ---------- guest counters (Phase 4) ----------
-- visitor_id is a LIFETIME counter: the guest allowance never refills, per the
-- no-daily-limits rule. window_start is meaningful only on the ip_hash path,
-- which keeps a rolling window purely so a shared NAT is not banned forever.
create table if not exists public.guest_credit_counters (
  visitor_id text primary key,
  ip_hash text,  -- sha256(ip + salt); the raw IP is never stored
  credits_used numeric(12, 4) not null default 0,
  requests integer not null default 0,
  window_start timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists guest_credit_counters_ip_idx
  on public.guest_credit_counters (ip_hash, window_start desc);

-- ---------- RLS ----------
alter table public.user_entitlements enable row level security;
alter table public.usage_counters enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.billing_events enable row level security;
alter table public.guest_credit_counters enable row level security;

-- Owners READ their own billing state and never write it. All writes go
-- through the service role. Read-own lets the plan UI read the entitlement
-- straight from the browser client with no API route; enforcement never
-- trusts that path and always re-reads server-side under lock.
drop policy if exists "Owner reads own entitlement" on public.user_entitlements;
create policy "Owner reads own entitlement" on public.user_entitlements
  for select using (auth.uid() = owner_id);

drop policy if exists "Owner reads own counters" on public.usage_counters;
create policy "Owner reads own counters" on public.usage_counters
  for select using (auth.uid() = owner_id);

drop policy if exists "Owner reads own ledger" on public.usage_ledger;
create policy "Owner reads own ledger" on public.usage_ledger
  for select using (auth.uid() = owner_id);

-- No insert/update/delete policies anywhere: RLS default-denies, so anon and
-- authenticated cannot mutate billing state at all.
--
-- Deliberately NO admin policy: admin identity lives in ADMIN_ALLOWED_EMAILS
-- app config, not the database, so a policy would have nothing to key on.
-- Admin reads go through getAdminUser() + the service-role client, exactly as
-- /admin/analytics/usage already does.

revoke all on table public.billing_events from anon, authenticated;
revoke all on table public.guest_credit_counters from anon, authenticated;

-- ---------- default entitlement on signup ----------
-- credits_per_period is seeded at 0 on purpose: the free allowance lives in
-- lib/billing/plans.ts alone, and ensureEntitlement() lazily upgrades a stale
-- snapshot on first touch. Keeps one source of truth for the number.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  -- Billing must never be able to block a signup. If this insert fails for any
  -- reason, the account is still created and ensureEntitlement() will backfill
  -- the row on first touch.
  begin
    insert into public.user_entitlements (owner_id, plan_id, credits_per_period)
    values (new.id, 'free', 0)
    on conflict (owner_id) do nothing;
  exception when others then
    raise warning 'handle_new_user: entitlement insert failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Backfill existing users so every account has an entitlement row.
insert into public.user_entitlements (owner_id, plan_id, credits_per_period)
select u.id, 'free', 0 from auth.users u
on conflict (owner_id) do nothing;
