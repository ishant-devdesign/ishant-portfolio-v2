-- Add editable contact CTA support.
-- Run this on an existing database after the base schema.
-- Other contact fields already exist on site_settings.

alter table public.site_settings
add column if not exists contact_cta_text text;

update public.site_settings
set contact_cta_text = coalesce(
  contact_cta_text,
  'If you are building something that needs stronger interface clarity, sharper frontend execution, or a more thoughtful bridge between design and implementation, I would be glad to talk.'
),
updated_at = now();
