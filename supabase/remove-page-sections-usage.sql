-- Final migration to retire public.page_sections.
-- Home narrative copy now lives in src/lib/site-config.ts.
-- The only dynamic hero field previously stored there is migrated into site_settings.hero_how_text.

alter table public.site_settings
add column if not exists hero_how_text text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'page_sections'
  ) then
    update public.site_settings s
    set hero_how_text = coalesce(
      (
        select ps.content_json ->> 'howText'
        from public.page_sections ps
        where ps.page_key = 'home'
          and ps.section_key = 'hero_widget'
        limit 1
      ),
      s.hero_how_text,
      'Interface craft + frontend precision with a frontend-first execution mindset.'
    ),
    updated_at = now();

    execute 'drop trigger if exists trg_page_sections_updated_at on public.page_sections';
    execute 'drop policy if exists "public read page sections" on public.page_sections';
    execute 'drop policy if exists "admin all page_sections" on public.page_sections';
    execute 'drop table if exists public.page_sections';
  end if;
end $$;
