-- Podcaster outreach, prospecting fields.
--
-- The daily prospecting routine (.claude/skills/podcast-outreach-prospecting)
-- lands leads in the Google tracking sheet and mirrors them here so
-- /admin/outreach can show them and collect the morning review decisions. The
-- sheet is the system of record; this table is the portal's copy, matched to
-- it row for row by `podcast_key`.
--
-- Additive only: every column is nullable or defaulted, so the hand-added rows
-- (Jagadamba, FreshMenu) keep working untouched.

alter table public.outreach_podcasters
  -- Identity and provenance
  add column if not exists podcast_key text,
  add column if not exists source text not null default 'manual',
  add column if not exists run_id text,
  add column if not exists added_on date,

  -- Pipeline. `stage` is where the row is; `decision` is what the morning
  -- review chose for it.
  add column if not exists stage text not null default 'new',
  add column if not exists decision text,
  add column if not exists example_canvas_from uuid
    references public.outreach_podcasters (id) on delete set null,
  add column if not exists reviewed_at timestamptz,

  -- Show
  add column if not exists lane text,
  add column if not exists domain text,
  add column if not exists niche text,
  add column if not exists country text,
  add column if not exists language text,
  add column if not exists content_fit_note text,

  -- Traction (every figure read on metrics_measured_on, never estimated)
  add column if not exists traction_tier text,
  add column if not exists subscribers bigint,
  add column if not exists median_views_last10 bigint,
  add column if not exists views_range_last10 text,
  add column if not exists last_episode_date date,
  add column if not exists cadence text,
  add column if not exists metrics_measured_on date,
  add column if not exists metrics_source text,
  add column if not exists rank_in_competitor_set text,

  -- Repeating groups, as arrays of objects (shapes in lib/outreach/podcasters.ts)
  add column if not exists top_videos jsonb not null default '[]'::jsonb,
  add column if not exists competitors jsonb not null default '[]'::jsonb,
  add column if not exists emails jsonb not null default '[]'::jsonb,
  add column if not exists team jsonb not null default '[]'::jsonb,
  add column if not exists channels jsonb not null default '[]'::jsonb,
  add column if not exists not_found jsonb not null default '[]'::jsonb,

  -- Message and hand-off
  add column if not exists primary_email text,
  add column if not exists email_subject text,
  add column if not exists episode_referenced text,
  add column if not exists assumes_listened text,
  add column if not exists video_brief text,
  add column if not exists drive_folder_url text,
  add column if not exists gmail_draft_id text,
  add column if not exists notes text;

alter table public.outreach_podcasters
  drop constraint if exists outreach_podcasters_stage_check,
  add constraint outreach_podcasters_stage_check check (
    stage in ('new', 'queued', 'drafted', 'sent', 'replied', 'passed', 'skipped')
  ),
  drop constraint if exists outreach_podcasters_decision_check,
  add constraint outreach_podcasters_decision_check check (
    decision is null or decision in ('own_canvas', 'example_canvas', 'skip')
  ),
  drop constraint if exists outreach_podcasters_lane_check,
  add constraint outreach_podcasters_lane_check check (
    lane is null or lane in ('traction', 'emerging')
  ),
  drop constraint if exists outreach_podcasters_tier_check,
  add constraint outreach_podcasters_tier_check check (
    traction_tier is null or traction_tier in ('very high', 'high', 'mid', 'micro')
  );

-- The hand-added rows already have a canvas, video and copy: they are past review.
update public.outreach_podcasters
set stage = 'drafted', decision = 'own_canvas'
where source = 'manual' and stage = 'new';

create unique index if not exists outreach_podcasters_podcast_key_idx
  on public.outreach_podcasters (podcast_key)
  where podcast_key is not null;

create index if not exists outreach_podcasters_stage_idx
  on public.outreach_podcasters (stage);
