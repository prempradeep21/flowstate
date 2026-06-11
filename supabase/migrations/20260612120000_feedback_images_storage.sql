insert into storage.buckets (id, name, public, file_size_limit)
values ('feedback-images', 'feedback-images', false, 5242880)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Feedback image upload" on storage.objects;
create policy "Feedback image upload"
  on storage.objects for insert
  with check (
    bucket_id = 'feedback-images'
    and (
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
      or (storage.foldername(name))[1] = 'anonymous'
    )
  );

drop policy if exists "Feedback image read" on storage.objects;
create policy "Feedback image read"
  on storage.objects for select
  using (
    bucket_id = 'feedback-images'
    and (
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
      or (storage.foldername(name))[1] = 'anonymous'
    )
  );
