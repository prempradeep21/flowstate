-- Track meaningful canvas edits (questions, artifacts) separately from viewport visits.
alter table public.canvases
  add column if not exists content_edited_at timestamptz;

update public.canvases
  set content_edited_at = updated_at
  where content_edited_at is null;

alter table public.canvases
  alter column content_edited_at set default now();

create index if not exists canvases_owner_content_edited_at_idx
  on public.canvases (owner_id, content_edited_at desc nulls last);
