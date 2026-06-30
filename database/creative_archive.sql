-- Creative Archive Database Schema
-- Minimal table for storing creative work media references
-- Run this in Supabase SQL Editor

-- Table: creative_archive
-- Stores references to uploaded media (images and videos)
-- No titles, captions, categories, or metadata - visuals speak for themselves

create table if not exists creative_archive (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  sort_order integer not null default 0
);

-- Enable RLS for security
alter table creative_archive enable row level security;

-- Trigger function to auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to auto-update updated_at
drop trigger if exists update_creative_archive_updated_at on creative_archive;
create trigger update_creative_archive_updated_at
  before update on creative_archive
  for each row
  execute procedure update_updated_at_column();

-- Drop existing policies if they exist (to allow re-running this script)
drop policy if exists "creative_archive_public_read" on creative_archive;
drop policy if exists "creative_archive_admin_insert" on creative_archive;
drop policy if exists "creative_archive_admin_update" on creative_archive;
drop policy if exists "creative_archive_admin_delete" on creative_archive;

-- Policy: Allow public read access (anyone can view the archive)
create policy "creative_archive_public_read"
  on creative_archive
  for select
  using (true);

-- Policy: Allow authenticated admins to insert (upload new media)
create policy "creative_archive_admin_insert"
  on creative_archive
  for insert
  to authenticated
  with check (
    (select email from allowed_admins where email = auth.email()) is not null
  );

-- Policy: Allow authenticated admins to update (reorder, delete)
create policy "creative_archive_admin_update"
  on creative_archive
  for update
  to authenticated
  using (
    (select email from allowed_admins where email = auth.email()) is not null
  );

-- Policy: Allow authenticated admins to delete
create policy "creative_archive_admin_delete"
  on creative_archive
  for delete
  to authenticated
  using (
    (select email from allowed_admins where email = auth.email()) is not null
  );

-- Index for efficient ordering queries
create index if not exists idx_creative_archive_sort_order
  on creative_archive (sort_order);


-- ============================================
-- Storage bucket: archive-media
-- ============================================
-- Supported formats:
-- Images: jpg, jpeg, png, webp, gif
-- Videos: mp4, webm

-- IMPORTANT: Create the storage bucket manually in Supabase dashboard:
-- Go to Storage > Buckets > New bucket
-- Name: archive-media
-- Public: Yes (checked)
-- File size limit: 50MB (or as needed)
-- Allowed MIME types (optional):
--   image/jpeg, image/png, image/webp, image/gif
--   video/mp4, video/webm

-- Storage policies for archive-media bucket:

-- Drop existing storage policies if they exist
drop policy if exists "archive_media_public_read" on storage.objects;
drop policy if exists "archive_media_admin_insert" on storage.objects;
drop policy if exists "archive_media_admin_delete" on storage.objects;

-- Policy: Allow public read access to archive-media
create policy "archive_media_public_read"
  on storage.objects
  for select
  using (bucket_id = 'archive-media');

-- Policy: Allow authenticated admins to insert (upload)
create policy "archive_media_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'archive-media'
    and (select email from allowed_admins where email = auth.email()) is not null
  );

-- Policy: Allow authenticated admins to delete
create policy "archive_media_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'archive-media'
    and (select email from allowed_admins where email = auth.email()) is not null
  );