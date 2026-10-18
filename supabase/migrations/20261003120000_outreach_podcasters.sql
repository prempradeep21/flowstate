-- Podcaster outreach: one row per podcaster, carrying everything we send them.
--
-- Admin-only. RLS is on with no policies, so anon and authenticated roles see
-- nothing; /api/admin/outreach reads and writes through the service role after
-- getAdminUser(). Copies are plain text, edited in place from /admin/outreach.

create table if not exists public.outreach_podcasters (
  id uuid primary key default gen_random_uuid(),
  host_name text not null,
  podcast_name text not null,
  podcast_url text,
  canvas_url text,
  -- Object path inside the outreach-media bucket, not a URL, so the bucket can
  -- move without rewriting rows.
  video_path text,
  email_copy text not null default '',
  dm_copy text not null default '',
  social_copy text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.outreach_podcasters enable row level security;

-- Showcase videos. Public because the links are only ever handed out by us and
-- the video is the thing we want a podcaster to watch; 50 MB covers a 60 s
-- 1080p render with room to spare.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outreach-media',
  'outreach-media',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
