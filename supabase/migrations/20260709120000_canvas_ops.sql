-- Canvas op log: entity-level delta persistence + realtime collab foundation.
--
-- Today every edit rewrites the full ~1MB canvases.state JSONB row and
-- collaborators receive whole snapshots through postgres_changes. Op batches
-- are 1–5KB inserts fanned out over a broadcast channel; the snapshot becomes
-- a periodically-compacted checkpoint (canvases.rev = last folded op id).
-- Flag-gated client rollout via NEXT_PUBLIC_CANVAS_OPS=1.

-- Checkpoint revision: the op id up to which canvases.state already includes
-- all ops. Ops with id > rev replay on load.
alter table public.canvases
  add column if not exists rev bigint not null default 0;

create table if not exists public.canvas_ops (
  id bigint generated always as identity primary key,
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  -- Client's checkpoint rev when the batch was produced (debug/conflict aid;
  -- ops are idempotent whole-entity LWW upserts so replay order == id order).
  base_rev bigint not null default 0,
  -- Batch of CanvasOp entries (see lib/canvasOps.ts): upsert/move/delete/
  -- order/meta keyed by entity kind + id.
  ops jsonb not null,
  -- Client batch uuid for self-echo suppression on the broadcast channel.
  batch_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists canvas_ops_canvas_id_id_idx
  on public.canvas_ops (canvas_id, id);

alter table public.canvas_ops enable row level security;

-- Owners and editors write ops; anyone with access reads them (load replay).
create policy "canvas_ops_insert_editors"
  on public.canvas_ops for insert
  with check (
    actor_id = auth.uid()
    and public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );

create policy "canvas_ops_select_members"
  on public.canvas_ops for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
  );

-- Compaction: fold is done client-side (the saver already holds the full
-- state); this RPC just records the checkpoint and prunes folded ops.
-- p_rev must come from the max op id the snapshot actually includes.
create or replace function public.compact_canvas(p_canvas_id uuid, p_rev bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.user_canvas_role(p_canvas_id, auth.uid()) not in ('owner', 'editor') then
    raise exception 'not authorized to compact canvas %', p_canvas_id;
  end if;

  update public.canvases
    set rev = greatest(rev, p_rev)
    where id = p_canvas_id;

  delete from public.canvas_ops
    where canvas_id = p_canvas_id
      and id <= p_rev;
end;
$$;

-- Artifact payload splitting (follow-up wiring): big custom-UI HTML blobs
-- move out of canvases.state so snapshots stay small.
create table if not exists public.canvas_artifact_payloads (
  artifact_id text primary key,
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  content text,
  storage_path text,
  content_hash text,
  updated_at timestamptz not null default now()
);

create index if not exists canvas_artifact_payloads_canvas_idx
  on public.canvas_artifact_payloads (canvas_id);

alter table public.canvas_artifact_payloads enable row level security;

create policy "canvas_artifact_payloads_select_members"
  on public.canvas_artifact_payloads for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
  );

create policy "canvas_artifact_payloads_write_editors"
  on public.canvas_artifact_payloads for insert
  with check (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );

create policy "canvas_artifact_payloads_update_editors"
  on public.canvas_artifact_payloads for update
  using (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );

create policy "canvas_artifact_payloads_delete_editors"
  on public.canvas_artifact_payloads for delete
  using (
    public.user_canvas_role(canvas_id, auth.uid()) in ('owner', 'editor')
  );
