-- Expand the seeded editorial tone for the home page.
-- Home narrative copy now lives in src/lib/site-config.ts instead of public.page_sections.
-- This script only updates the dynamic trajectory records that still come from Supabase.

update public.work_experience
set note = case company
  when 'Fourcore Labs Private Limited' then 'Built modern frontend features and reusable UI patterns for cybersecurity-focused product surfaces, with an emphasis on usability, consistency, and maintainability under active product iteration.'
  when 'ADS247365 India Private Limited' then 'Delivered scalable React and Next.js interfaces across client products, while refactoring legacy UI, improving performance, and reducing long-term frontend friction.'
  else note
end,
updated_at = now();

update public.education_items
set note = 'Formal grounding in engineering thinking, problem solving, and system design that later evolved into a design-sensitive frontend practice.',
updated_at = now();
