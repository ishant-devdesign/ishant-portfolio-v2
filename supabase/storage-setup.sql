-- Supabase Storage setup for Ishant Portfolio
-- Recommended: run this after schema.sql

insert into storage.buckets (id, name, public)
values
  ('site-assets', 'site-assets', true),
  ('project-media', 'project-media', true),
  ('blog-media', 'blog-media', true),
  ('certification-badges', 'certification-badges', true),
  ('pet-media', 'pet-media', true)
on conflict (id) do update
set public = excluded.public;

-- Public read access for portfolio assets.
drop policy if exists "public read portfolio storage" on storage.objects;
create policy "public read portfolio storage"
  on storage.objects for select
  using (
    bucket_id in (
      'site-assets',
      'project-media',
      'blog-media',
      'certification-badges',
      'pet-media'
    )
  );

-- Admin upload / create.
drop policy if exists "admin insert portfolio storage" on storage.objects;
create policy "admin insert portfolio storage"
  on storage.objects for insert
  with check (
    public.is_allowed_admin()
    and bucket_id in (
      'site-assets',
      'project-media',
      'blog-media',
      'certification-badges',
      'pet-media'
    )
  );

-- Admin update existing storage objects.
drop policy if exists "admin update portfolio storage" on storage.objects;
create policy "admin update portfolio storage"
  on storage.objects for update
  using (
    public.is_allowed_admin()
    and bucket_id in (
      'site-assets',
      'project-media',
      'blog-media',
      'certification-badges',
      'pet-media'
    )
  )
  with check (
    public.is_allowed_admin()
    and bucket_id in (
      'site-assets',
      'project-media',
      'blog-media',
      'certification-badges',
      'pet-media'
    )
  );

-- Admin delete storage objects.
drop policy if exists "admin delete portfolio storage" on storage.objects;
create policy "admin delete portfolio storage"
  on storage.objects for delete
  using (
    public.is_allowed_admin()
    and bucket_id in (
      'site-assets',
      'project-media',
      'blog-media',
      'certification-badges',
      'pet-media'
    )
  );
