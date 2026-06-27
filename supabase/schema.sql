-- Ishant Portfolio — expanded Supabase schema
-- Updated to better match the current frontend expectations and editable CMS scope.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Core settings / access
-- -----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Ishant Kumar',
  site_tagline text,
  short_mark text default 'ik',
  hero_eyebrow text,
  hero_name text,
  hero_heading text,
  hero_subheading text,
  hero_intro text,
  hero_how_text text,
  location_label text,
  availability_label text,
  spotify_embed_url text,
  spotify_title text,
  show_profile_image boolean not null default false,
  profile_image_url text,
  resume_external_url text,
  contact_email text,
  contact_phone text,
  contact_whatsapp_url text,
  contact_gmail_url text,
  linkedin_url text,
  github_url text,
  contact_cta_text text,
  twitter_url text,
  instagram_url text,
  dribbble_url text,
  behance_url text,
  admin_primary_email text not null,
  admin_backup_email text not null,
  require_recent_reauth_for_sensitive_changes boolean not null default true,
  loader_enabled boolean not null default true,
  loader_symbols text[] not null default '{}',
  loader_name_text text,
  cursor_effects_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.allowed_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reauth_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  purpose text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Work / education (editable trajectory data)
-- -----------------------------------------------------------------------------

create table if not exists public.work_experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  period_label text not null,
  note text,
  location text,
  featured boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_items (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null,
  period_label text not null,
  note text,
  featured boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tool_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tools_text text not null,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Shared tags
-- -----------------------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  sector text,
  year_label text,
  role text,
  stack_text text,
  hero_image_url text,
  gallery_json jsonb not null default '[]'::jsonb,
  content_blocks jsonb not null default '[]'::jsonb,
  challenge text,
  approach text,
  outcome text,
  metrics_json jsonb not null default '{}'::jsonb,
  links_json jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- Blogs
-- -----------------------------------------------------------------------------

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  cover_image_url text,
  content_blocks jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  reading_time_minutes int,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
  blog_id uuid not null references public.blogs(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (blog_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- Certifications
-- -----------------------------------------------------------------------------

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  issuer text not null,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  badge_image_url text,
  note text,
  featured boolean not null default false,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Pets
-- -----------------------------------------------------------------------------

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  species text,
  description text not null,
  story text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_images (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  image_url text not null,
  alt_text text,
  caption text,
  home_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Media library (shared across hero/blog/project/cert/pets)
-- -----------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  width int,
  height int,
  size_bytes bigint,
  alt_text text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Functions / triggers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_allowed_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.allowed_admins a
    where a.active = true
      and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Attach timestamps.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_settings',
    'allowed_admins',
    'work_experience',
    'education_items',
    'tool_groups',
    'tags',
    'projects',
    'blogs',
    'certifications',
    'pets',
    'pet_images'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- RLS enable
-- -----------------------------------------------------------------------------

alter table public.site_settings enable row level security;
alter table public.allowed_admins enable row level security;
alter table public.work_experience enable row level security;
alter table public.education_items enable row level security;
alter table public.tool_groups enable row level security;
alter table public.tags enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.blogs enable row level security;
alter table public.blog_tags enable row level security;
alter table public.certifications enable row level security;
alter table public.pets enable row level security;
alter table public.pet_images enable row level security;
alter table public.media_assets enable row level security;

-- -----------------------------------------------------------------------------
-- Public read policies
-- -----------------------------------------------------------------------------

drop policy if exists "public read work experience" on public.work_experience;
create policy "public read work experience"
  on public.work_experience for select
  using (visible = true);

drop policy if exists "public read education items" on public.education_items;
create policy "public read education items"
  on public.education_items for select
  using (visible = true);

drop policy if exists "public read tool groups" on public.tool_groups;
create policy "public read tool groups"
  on public.tool_groups for select
  using (visible = true);

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects"
  on public.projects for select
  using (status = 'published');

drop policy if exists "public read published blogs" on public.blogs;
create policy "public read published blogs"
  on public.blogs for select
  using (status = 'published');

drop policy if exists "public read certifications" on public.certifications;
create policy "public read certifications"
  on public.certifications for select
  using (visible = true);

drop policy if exists "public read pets" on public.pets;
create policy "public read pets"
  on public.pets for select
  using (visible = true);

drop policy if exists "public read pet images" on public.pet_images;
create policy "public read pet images"
  on public.pet_images for select
  using (
    exists (
      select 1 from public.pets p
      where p.id = pet_images.pet_id
        and p.visible = true
    )
  );

-- -----------------------------------------------------------------------------
-- Admin access policies
-- -----------------------------------------------------------------------------

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'work_experience',
    'education_items',
    'tool_groups',
    'tags',
    'projects',
    'project_tags',
    'blogs',
    'blog_tags',
    'certifications',
    'pets',
    'pet_images',
    'media_assets'
  ]
  loop
    execute format('drop policy if exists "admin all %I" on public.%I', tbl, tbl);
    execute format(
      'create policy "admin all %I" on public.%I for all using (public.is_allowed_admin()) with check (public.is_allowed_admin())',
      tbl,
      tbl
    );
  end loop;
end $$;

-- Restrict direct mutations for sensitive auth/settings rows until dedicated flows are added.
drop policy if exists "admin read site settings" on public.site_settings;
create policy "admin read site settings"
  on public.site_settings for select
  using (public.is_allowed_admin());

drop policy if exists "admin read allowed admins" on public.allowed_admins;
create policy "admin read allowed admins"
  on public.allowed_admins for select
  using (public.is_allowed_admin());

-- -----------------------------------------------------------------------------
-- Seed base access + initial settings
-- -----------------------------------------------------------------------------

insert into public.allowed_admins (email, label)
values
  ('ishant.devdesign@gmail.com', 'primary'),
  ('ishant121003@gmail.com', 'backup')
on conflict (email) do nothing;

insert into public.site_settings (
  site_name,
  site_tagline,
  short_mark,
  hero_eyebrow,
  hero_name,
  hero_heading,
  hero_subheading,
  hero_intro,
  hero_how_text,
  location_label,
  availability_label,
  spotify_embed_url,
  spotify_title,
  resume_external_url,
  contact_email,
  contact_phone,
  contact_whatsapp_url,
  contact_gmail_url,
  linkedin_url,
  github_url,
  contact_cta_text,
  admin_primary_email,
  admin_backup_email,
  loader_enabled,
  loader_symbols,
  loader_name_text,
  cursor_effects_enabled
)
select
  'Ishant Kumar',
  'Frontend Developer & UI/UX Designer',
  'ik',
  '00 / Intro',
  'Ishant Kumar',
  'Designer engineer shaping thoughtful interfaces, systems, and stories for the web.',
  'A dark editorial portfolio built around narrative, motion, and frontend execution.',
  'I work between interface design and implementation, translating clarity and user intent into polished digital experiences.',
  'Interface craft + frontend precision with a frontend-first execution mindset.',
  'Delhi NCR, India',
  'Available for product, frontend, and design opportunities',
  'https://open.spotify.com/embed/playlist/37i9dQZEVXcNheyb00KEzN?utm_source=generator&theme=0',
  'Listen with me',
  'https://example.com/ishant-kumar-resume.pdf',
  'ishant.devdesign@gmail.com',
  '+91 97180 22115',
  'https://wa.me/919718022115',
  'https://mail.google.com/mail/?view=cm&fs=1&to=ishant.devdesign@gmail.com',
  'https://linkedin.com/in/ishant-devdesign',
  'https://github.com/ishant-devdesign',
  'If you are building something that needs stronger interface clarity, sharper frontend execution, or a more thoughtful bridge between design and implementation, I would be glad to talk.',
  'ishant.devdesign@gmail.com',
  'ishant121003@gmail.com',
  true,
  array['$', '@', '#', '%', '&', '!', '*', '+', '?'],
  'Ishant Kumar',
  true
where not exists (
  select 1 from public.site_settings
);
