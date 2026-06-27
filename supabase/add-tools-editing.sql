-- Add editable Tools section support.
-- Run this on an existing database after the base schema.
-- The intro stays static in code; only the tool groups are editable.

create table if not exists public.tool_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tools_text text not null,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tool_groups_updated_at on public.tool_groups;
create trigger trg_tool_groups_updated_at
before update on public.tool_groups
for each row execute function public.set_updated_at();

alter table public.tool_groups enable row level security;

drop policy if exists "public read tool groups" on public.tool_groups;
create policy "public read tool groups"
  on public.tool_groups for select
  using (visible = true);

drop policy if exists "admin all tool_groups" on public.tool_groups;
create policy "admin all tool_groups"
  on public.tool_groups for all
  using (public.is_allowed_admin())
  with check (public.is_allowed_admin());

insert into public.tool_groups (title, tools_text, visible, sort_order)
select *
from (
  values
    ('Frontend', 'React.js, Next.js, TypeScript, JavaScript, HTML, CSS, Tailwind', true, 1),
    ('Design', 'Figma, Adobe XD, visual systems, interaction thinking', true, 2),
    ('Backend / Data', 'Node.js, Supabase, MySQL, REST APIs', true, 3),
    ('Infra / Quality', 'AWS, Docker, Git, Lighthouse, performance tuning', true, 4)
) as seed(title, tools_text, visible, sort_order)
where not exists (
  select 1 from public.tool_groups
);
