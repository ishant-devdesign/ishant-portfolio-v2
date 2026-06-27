-- Update current site_settings row with cleaner values.
-- Replace any placeholder URLs with final values later if needed.
-- Hero how text now lives directly on site_settings.

update public.site_settings
set
  site_name = 'Ishant Kumar',
  site_tagline = 'Frontend Developer and UI/UX Designer',
  short_mark = 'ik',
  hero_eyebrow = '00 / Intro',
  hero_name = 'Ishant Kumar',
  hero_heading = 'Designer engineer shaping thoughtful interfaces and frontend experiences.',
  hero_subheading = 'A dark editorial portfolio built around narrative, motion, and frontend craft.',
  hero_intro = 'I translate clarity and user intent into polished digital experiences.',
  hero_how_text = 'Interface craft + frontend precision with a frontend-first execution mindset.',
  location_label = 'Delhi NCR, India',
  availability_label = 'Available for product, frontend, and design opportunities',
  spotify_embed_url = 'https://open.spotify.com/embed/playlist/37i9dQZEVXcNheyb00KEzN?utm_source=generator&theme=0',
  spotify_title = 'Listen with me',
  show_profile_image = false,
  profile_image_url = null,
  resume_external_url = 'https://example.com/ishant-kumar-resume.pdf',
  contact_email = 'ishant.devdesign@gmail.com',
  contact_phone = '+91 97180 22115',
  contact_whatsapp_url = 'https://wa.me/919718022115',
  contact_gmail_url = 'https://mail.google.com/mail/?view=cm&fs=1&to=ishant.devdesign@gmail.com',
  linkedin_url = 'https://linkedin.com/in/ishant-devdesign',
  github_url = 'https://github.com/ishant-devdesign',
  contact_cta_text = 'If you are building something that needs stronger interface clarity, sharper frontend execution, or a more thoughtful bridge between design and implementation, I would be glad to talk.',
  twitter_url = null,
  instagram_url = null,
  dribbble_url = null,
  behance_url = null,
  admin_primary_email = 'ishant.devdesign@gmail.com',
  admin_backup_email = 'ishant121003@gmail.com',
  require_recent_reauth_for_sensitive_changes = true,
  loader_enabled = true,
  loader_symbols = array['$', '@', '#', '%', '&', '!', '*', '+', '?'],
  loader_name_text = 'Ishant Kumar',
  cursor_effects_enabled = true,
  updated_at = now()
where id is not null;
