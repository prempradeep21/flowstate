-- Optional per-canvas dashboard thumbnail: the public URL of a canvas image
-- asset the owner chose (right-click → "Set as thumbnail"). When null, the
-- dashboard falls back to the generated motion-graphic placeholder.
alter table public.canvases
  add column if not exists thumbnail_url text;
