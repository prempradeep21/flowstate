insert into storage.buckets (id, name, public, file_size_limit)
values ('asset-files', 'asset-files', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Canvas collaborators can read asset files" on storage.objects;
create policy "Canvas collaborators can read asset files"
  on storage.objects for select
  using (
    bucket_id = 'asset-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.canvases c
        where c.id::text = (storage.foldername(name))[2]
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.canvas_collaborators cc
        where cc.canvas_id::text = (storage.foldername(name))[2]
          and cc.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Canvas editors can upload asset files" on storage.objects;
create policy "Canvas editors can upload asset files"
  on storage.objects for insert
  with check (
    bucket_id = 'asset-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      exists (
        select 1
        from public.canvases c
        where c.id::text = (storage.foldername(name))[2]
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.canvas_collaborators cc
        where cc.canvas_id::text = (storage.foldername(name))[2]
          and cc.user_id = auth.uid()
          and cc.role in ('owner', 'editor')
      )
    )
  );

drop policy if exists "Canvas editors can delete asset files" on storage.objects;
create policy "Canvas editors can delete asset files"
  on storage.objects for delete
  using (
    bucket_id = 'asset-files'
    and (
      exists (
        select 1
        from public.canvases c
        where c.id::text = (storage.foldername(name))[2]
          and c.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.canvas_collaborators cc
        where cc.canvas_id::text = (storage.foldername(name))[2]
          and cc.user_id = auth.uid()
          and cc.role in ('owner', 'editor')
      )
    )
  );
