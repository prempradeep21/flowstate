-- Auto-captured dashboard thumbnails: a fit-to-content render of the canvas in
-- its own theme, taken client-side while the canvas sits idle after an edit.
--
-- A separate table rather than a column on canvases, on purpose: the
-- canvases_updated_at trigger bumps updated_at on EVERY row update, and the
-- autosave uses updated_at as its optimistic lock — a thumbnail write there
-- would make the next save of the open canvas look like a remote conflict
-- (and wake every collaborator's realtime listener for a picture).
--
-- The image itself lives in the private asset-files bucket at
-- <capturer_id>/<canvas_id>/canvas-thumbnail-<ts>.<ext>, so the existing
-- collaborator read/insert/delete storage policies already cover it.
-- canvases.thumbnail_url (an owner-picked image) still wins when set.
create table if not exists public.canvas_thumbnails (
  canvas_id uuid primary key references public.canvases(id) on delete cascade,
  storage_path text not null,
  captured_at timestamptz not null default now(),
  captured_by uuid references auth.users(id) on delete set null
);

alter table public.canvas_thumbnails enable row level security;

drop policy if exists "canvas_thumbnails_select_members" on public.canvas_thumbnails;
create policy "canvas_thumbnails_select_members"
  on public.canvas_thumbnails for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
  );

drop policy if exists "canvas_thumbnails_insert_editors" on public.canvas_thumbnails;
create policy "canvas_thumbnails_insert_editors"
  on public.canvas_thumbnails for insert
  with check (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );

drop policy if exists "canvas_thumbnails_update_editors" on public.canvas_thumbnails;
create policy "canvas_thumbnails_update_editors"
  on public.canvas_thumbnails for update
  using (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );

drop policy if exists "canvas_thumbnails_delete_editors" on public.canvas_thumbnails;
create policy "canvas_thumbnails_delete_editors"
  on public.canvas_thumbnails for delete
  using (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );
