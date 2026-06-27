-- Ishant Portfolio — seed content
-- Run this after schema.sql (and ideally after storage-setup.sql)

-- -----------------------------------------------------------------------------
-- Work experience
-- -----------------------------------------------------------------------------

insert into public.work_experience (
  company,
  role,
  period_label,
  note,
  featured,
  visible,
  sort_order
)
values
  (
    'Fourcore Labs Private Limited',
    'Frontend Developer',
    'Jun 2025 — Feb 2026',
    'Built modern frontend features and reusable UI patterns for cybersecurity-focused product surfaces.',
    true,
    true,
    1
  ),
  (
    'ADS247365 India Private Limited',
    'Frontend React Developer',
    'Jun 2024 — May 2025',
    'Delivered scalable React and Next.js interfaces, refactored legacy UI, and improved performance across client products.',
    true,
    true,
    2
  )
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Education
-- -----------------------------------------------------------------------------

insert into public.education_items (
  institution,
  degree,
  period_label,
  note,
  featured,
  visible,
  sort_order
)
values
  (
    'VIT Bhopal',
    'B.Tech — Computer Science & Engineering',
    '2020 — 2024',
    'Formal foundation in engineering thinking, system design, and problem-solving that later fed into frontend and UI/UX work.',
    true,
    true,
    1
  )
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Tool groups
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- Tags
-- -----------------------------------------------------------------------------

insert into public.tags (name, slug, description)
values
  ('dashboard', 'dashboard', null),
  ('frontend', 'frontend', null),
  ('ui-systems', 'ui-systems', null),
  ('case-study', 'case-study', null),
  ('ux', 'ux', null),
  ('forms', 'forms', null),
  ('research-informed', 'research-informed', null),
  ('design-system', 'design-system', null),
  ('components', 'components', null),
  ('scalability', 'scalability', null),
  ('portal', 'portal', null),
  ('responsive', 'responsive', null),
  ('crud', 'crud', null),
  ('experimental', 'experimental', null),
  ('editorial', 'editorial', null),
  ('motion', 'motion', null),
  ('typography', 'typography', null),
  ('craft', 'craft', null),
  ('product-thinking', 'product-thinking', null),
  ('design-systems', 'design-systems', null),
  ('implementation', 'implementation', null),
  ('systems', 'systems', null),
  ('information-design', 'information-design', null),
  ('portfolio', 'portfolio', null),
  ('narrative', 'narrative', null)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------

insert into public.projects (
  slug,
  title,
  summary,
  sector,
  year_label,
  role,
  stack_text,
  hero_image_url,
  gallery_json,
  content_blocks,
  challenge,
  approach,
  outcome,
  metrics_json,
  links_json,
  featured,
  status,
  sort_order,
  published_at
)
values
  (
    'sentinel-command-center',
    'Sentinel Command Center',
    'Reframing a dense cybersecurity monitoring experience into a calmer, faster command layer for analysts working under pressure.',
    'Cybersecurity product',
    '2025–2026',
    'Frontend Developer · UI systems partner',
    'Next.js, TypeScript, Tailwind, Charts, Design QA',
    '/previews/project-sentinel-command-center.svg',
    '[]'::jsonb,
    $project1$[
      {"id":"p1h1","type":"heading","data":{"level":2,"text":"Challenge"}},
      {"id":"p1p1","type":"paragraph","data":{"html":"<p>The original product surface was functional but visually noisy. Analysts had to parse too many competing priorities at once, especially when triaging live incidents.</p>"}},
      {"id":"p1h2","type":"heading","data":{"level":2,"text":"Approach"}},
      {"id":"p1p2","type":"paragraph","data":{"html":"<p>I collaborated across product, design, and engineering to simplify panel hierarchy, introduce stronger decision states, and create reusable frontend components that preserved consistency under frequent iteration.</p>"}},
      {"id":"p1h3","type":"heading","data":{"level":2,"text":"Outcome"}},
      {"id":"p1p3","type":"paragraph","data":{"html":"<p>The result was a more legible command center that felt sharper under real usage, reduced friction in day-to-day navigation, and gave the team a more maintainable UI foundation.</p>"}}
    ]$project1$::jsonb,
    'The original product surface was functional but visually noisy. Analysts had to parse too many competing priorities at once, especially when triaging live incidents.',
    'I collaborated across product, design, and engineering to simplify panel hierarchy, introduce stronger decision states, and create reusable frontend components that preserved consistency under frequent iteration.',
    'The result was a more legible command center that felt sharper under real usage, reduced friction in day-to-day navigation, and gave the team a more maintainable UI foundation.',
    '["Reduced operator scan time across key threat panels by 28%","Built reusable pattern library used across 14+ product surfaces","Lifted visual consistency during feature rollout across multiple modules"]'::jsonb,
    '{}'::jsonb,
    true,
    'published',
    1,
    '2026-02-15T00:00:00Z'::timestamptz
  ),
  (
    'estate-clarity-workbench',
    'Estate Clarity Workbench',
    'A legaltech self-serve flow shaped to reduce hesitation, improve comprehension, and make high-stakes forms feel navigable rather than bureaucratic.',
    'Legaltech experience',
    '2025',
    'UI/UX + Frontend execution',
    'React, Form architecture, Accessibility, Content design',
    '/previews/project-estate-clarity-workbench.svg',
    '[]'::jsonb,
    $project2$[
      {"id":"p2h1","type":"heading","data":{"level":2,"text":"Challenge"}},
      {"id":"p2p1","type":"paragraph","data":{"html":"<p>Users were navigating emotionally heavy, regulation-sensitive flows without enough clarity. The experience needed to reduce intimidation without oversimplifying the legal seriousness of the process.</p>"}},
      {"id":"p2h2","type":"heading","data":{"level":2,"text":"Approach"}},
      {"id":"p2p2","type":"paragraph","data":{"html":"<p>I paired interface hierarchy with explanatory pacing, breaking complex decisions into calmer steps, improving field grouping, and translating UX intent into production-grade responsive components.</p>"}},
      {"id":"p2h3","type":"heading","data":{"level":2,"text":"Outcome"}},
      {"id":"p2p3","type":"paragraph","data":{"html":"<p>The journey became easier to trust, easier to scan, and more resilient across screen sizes. It better balanced reassurance with precision.</p>"}}
    ]$project2$::jsonb,
    'Users were navigating emotionally heavy, regulation-sensitive flows without enough clarity. The experience needed to reduce intimidation without oversimplifying the legal seriousness of the process.',
    'I paired interface hierarchy with explanatory pacing, breaking complex decisions into calmer steps, improving field grouping, and translating UX intent into production-grade responsive components.',
    'The journey became easier to trust, easier to scan, and more resilient across screen sizes. It better balanced reassurance with precision.',
    '["Improved completion confidence through content pacing and flow restructuring","Introduced reusable progressive disclosure patterns for dense form moments","Raised accessibility coverage in critical form interactions"]'::jsonb,
    '{}'::jsonb,
    true,
    'published',
    2,
    '2025-10-01T00:00:00Z'::timestamptz
  ),
  (
    'pulse-design-language',
    'Pulse Design Language',
    'A modular component and motion foundation built to align product surfaces that had drifted visually and structurally over time.',
    'Internal design system',
    '2024–2025',
    'Frontend React Developer',
    'Next.js, Storybook mindset, Tokenization, Component APIs',
    '/previews/project-pulse-design-language.svg',
    '[]'::jsonb,
    '[]'::jsonb,
    'Multiple products had evolved quickly without a dependable shared pattern system, leading to duplication, inconsistent states, and slower delivery.',
    'I helped define component structures, align implementation conventions, and rebuild commonly repeated patterns as reusable units with clearer constraints.',
    'The system improved maintainability while giving designers and engineers a more stable shared language.',
    '["Cut repeat implementation effort across recurring UI blocks","Reduced visual drift and styling inconsistencies across product teams","Created a cleaner handoff rhythm between design and development"]'::jsonb,
    '{}'::jsonb,
    false,
    'published',
    3,
    '2025-05-01T00:00:00Z'::timestamptz
  ),
  (
    'atlas-client-portal',
    'Atlas Client Portal',
    'A client-facing workspace focused on clarity, progress visibility, and trust-building for repeat interactions across devices.',
    'Service platform',
    '2024',
    'Frontend React Developer',
    'React, REST APIs, Responsive UI, Performance tuning',
    '/previews/project-atlas-client-portal.svg',
    '[]'::jsonb,
    '[]'::jsonb,
    'The platform had become difficult to extend and increasingly fragile to update, especially on smaller devices and in multi-step workflows.',
    'I refactored legacy UI patterns, streamlined data handling, and tuned responsive behavior so the product felt more dependable in daily use.',
    'The portal became faster, cleaner to maintain, and more coherent for users moving across desktop and mobile contexts.',
    '["Reduced page load time by approximately 35% after optimization pass","Improved mobile usability for repeat returning users","Refactored aging views into more maintainable modules"]'::jsonb,
    '{}'::jsonb,
    false,
    'published',
    4,
    '2024-11-01T00:00:00Z'::timestamptz
  ),
  (
    'ember-notes-lab',
    'Ember Notes Lab',
    'An experimental editorial micro product exploring calm reading states, variable typography, and tactile navigation cues.',
    'Concept / experimental',
    '2026',
    'Concept, interaction, prototype',
    'Motion, Variable type, Prototype engineering',
    '/previews/project-ember-notes-lab.svg',
    '[]'::jsonb,
    '[]'::jsonb,
    'The goal was not utility alone, but to test how a reading surface could feel authored through motion and type without becoming fragile.',
    'I treated the prototype like a motion lab: testing width interpolation, directional transitions, and quieter affordances for link discovery.',
    'The experiment shaped the tone and interaction logic now feeding this portfolio direction.',
    '["Prototype work focused on motion-led storytelling rather than launch metrics","Explored typography as interaction, not decoration","Built to test expressive reading transitions and section memory"]'::jsonb,
    '{}'::jsonb,
    false,
    'draft',
    5,
    null
  )
on conflict (slug) do nothing;

insert into public.project_tags (project_id, tag_id)
select p.id, t.id
from public.projects p
join public.tags t on t.slug = any (
  case p.slug
    when 'sentinel-command-center' then array['dashboard','frontend','ui-systems','case-study']
    when 'estate-clarity-workbench' then array['ux','forms','frontend','research-informed']
    when 'pulse-design-language' then array['design-system','frontend','components','scalability']
    when 'atlas-client-portal' then array['portal','responsive','frontend','crud']
    when 'ember-notes-lab' then array['experimental','editorial','motion','typography']
    else array[]::text[]
  end
)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Blogs
-- -----------------------------------------------------------------------------

insert into public.blogs (
  slug,
  title,
  excerpt,
  cover_image_url,
  content_blocks,
  featured,
  status,
  reading_time_minutes,
  published_at,
  seo_title,
  seo_description
)
values
  (
    'why-interfaces-need-breathing-room',
    'Why Interfaces Need Breathing Room Before They Need More Features',
    'A note on restraint, interface pacing, and why clarity often arrives through subtraction rather than decorative polish.',
    '/previews/blog-why-interfaces-need-breathing-room.svg',
    $blog1$[
      {"id":"b1h1","type":"heading","data":{"level":2,"text":"The pressure to keep adding"}},
      {"id":"b1p1","type":"paragraph","data":{"html":"<p>Teams often confuse movement with progress. A feature request arrives, a control gets added, a panel gets split, a shortcut appears, and soon the interface becomes a negotiation between every prior decision.</p>"}},
      {"id":"b1h2","type":"heading","data":{"level":2,"text":"Breathing room is operational"}},
      {"id":"b1p2","type":"paragraph","data":{"html":"<p>Whitespace, pacing, and hierarchy are not aesthetic extras. They affect how quickly people recover context, compare choices, and trust what the screen is asking of them.</p>"}},
      {"id":"b1h3","type":"heading","data":{"level":2,"text":"The more mature move"}},
      {"id":"b1p3","type":"paragraph","data":{"html":"<p>A better product question is not just what needs to be visible, but what deserves to be quiet right now. That difference often decides whether an interface feels authored or merely accumulated.</p>"}}
    ]$blog1$::jsonb,
    true,
    'published',
    7,
    '2026-05-12T00:00:00Z'::timestamptz,
    null,
    null
  ),
  (
    'when-frontend-becomes-product-design',
    'When Frontend Work Quietly Becomes Product Design',
    'On the moments where implementation choices change the product experience more than the mockups ever could.',
    '/previews/blog-when-frontend-becomes-product-design.svg',
    $blog2$[
      {"id":"b2h1","type":"heading","data":{"level":2,"text":"The gap between approved and shipped"}},
      {"id":"b2p1","type":"paragraph","data":{"html":"<p>Most interfaces are not made in Figma alone. They are completed in the judgement calls that happen while handling states, edge cases, animation timing, responsiveness, and content unpredictability.</p>"}},
      {"id":"b2h2","type":"heading","data":{"level":2,"text":"Implementation has a point of view"}},
      {"id":"b2p2","type":"paragraph","data":{"html":"<p>How transitions resolve, where empty states land, and how dense content collapses on small screens are product decisions, whether or not they are labeled that way.</p>"}}
    ]$blog2$::jsonb,
    false,
    'published',
    6,
    '2026-03-15T00:00:00Z'::timestamptz,
    null,
    null
  ),
  (
    'designing-for-calm-complexity',
    'Designing for Calm Complexity',
    'A short reflection on making dense systems feel manageable without pretending the underlying complexity does not exist.',
    '/previews/blog-designing-for-calm-complexity.svg',
    $blog3$[
      {"id":"b3h1","type":"heading","data":{"level":2,"text":"Calm is not simplification theatre"}},
      {"id":"b3p1","type":"paragraph","data":{"html":"<p>Some systems are genuinely complex. The work is not to flatten them into false ease, but to help users move through that complexity with better orientation and less cognitive drag.</p>"}},
      {"id":"b3h2","type":"heading","data":{"level":2,"text":"The interface as interpreter"}},
      {"id":"b3p2","type":"paragraph","data":{"html":"<p>Good UX does not remove nuance; it stages it. It helps users know what matters now, what can wait, and what consequence a choice carries.</p>"}}
    ]$blog3$::jsonb,
    false,
    'published',
    8,
    '2025-11-11T00:00:00Z'::timestamptz,
    null,
    null
  ),
  (
    'what-makes-a-portfolio-feel-authored',
    'What Makes a Portfolio Feel Authored',
    'On sequencing, tone, and the difference between showing work and shaping a point of view.',
    '/previews/blog-what-makes-a-portfolio-feel-authored.svg',
    $blog4$[
      {"id":"b4h1","type":"heading","data":{"level":2,"text":"The portfolio is also a product"}},
      {"id":"b4p1","type":"paragraph","data":{"html":"<p>A portfolio is not just an archive of outcomes. It is an interface that teaches someone how you think, what you notice, and where your standards are.</p>"}},
      {"id":"b4h2","type":"heading","data":{"level":2,"text":"Voice shows up in structure"}},
      {"id":"b4p2","type":"paragraph","data":{"html":"<p>Often the strongest signal is not a dramatic visual trick but the order of things: what gets introduced first, what earns more space, and what gets said with confidence.</p>"}}
    ]$blog4$::jsonb,
    false,
    'published',
    5,
    '2025-06-17T00:00:00Z'::timestamptz,
    null,
    null
  )
on conflict (slug) do nothing;

insert into public.blog_tags (blog_id, tag_id)
select b.id, t.id
from public.blogs b
join public.tags t on t.slug = any (
  case b.slug
    when 'why-interfaces-need-breathing-room' then array['ux','craft','product-thinking']
    when 'when-frontend-becomes-product-design' then array['frontend','design-systems','implementation']
    when 'designing-for-calm-complexity' then array['systems','ux','information-design']
    when 'what-makes-a-portfolio-feel-authored' then array['editorial','portfolio','narrative']
    else array[]::text[]
  end
)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Certifications
-- -----------------------------------------------------------------------------

insert into public.certifications (
  slug,
  title,
  issuer,
  issue_date,
  credential_id,
  credential_url,
  badge_image_url,
  note,
  featured,
  visible,
  sort_order
)
values
  (
    'aws-certified-cloud-practitioner',
    'AWS Certified Cloud Practitioner',
    'Amazon Web Services',
    '2025-01-01',
    null,
    'https://example.com/cert/aws-cloud-practitioner',
    null,
    'Useful grounding for cloud aware product work, platform conversations, and frontend decisions that depend on infrastructure realities.',
    true,
    true,
    1
  ),
  (
    'aws-academy-cloud-foundations',
    'AWS Academy Cloud Foundations',
    'AWS Academy',
    '2024-01-01',
    null,
    'https://example.com/cert/aws-academy',
    null,
    'A practical bridge between application thinking and foundational cloud concepts.',
    false,
    true,
    2
  ),
  (
    'ibm-machine-learning-with-python',
    'IBM Machine Learning with Python',
    'IBM',
    '2024-01-01',
    null,
    'https://example.com/cert/ibm-ml-python',
    null,
    'Supports analytical thinking and broader technical fluency beyond pure UI work.',
    false,
    true,
    3
  ),
  (
    'goldman-sachs-engineering-virtual-program',
    'Goldman Sachs Engineering Virtual Program',
    'Goldman Sachs',
    '2024-01-01',
    null,
    null,
    null,
    'A signal of structured problem solving and engineering context beyond visual surface work.',
    false,
    true,
    4
  ),
  (
    'google-ux-design',
    'Google UX Design',
    'Google',
    '2023-01-01',
    null,
    'https://example.com/cert/google-ux-design',
    null,
    'A strong complement to product thinking, research framing, and interaction clarity.',
    false,
    true,
    5
  ),
  (
    'applied-data-science-externship',
    'Applied Data Science Externship',
    'Externship Program',
    '2023-01-01',
    null,
    null,
    null,
    'Helps connect interface decisions to evidence, patterns, and measurable behavior.',
    false,
    true,
    6
  )
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Pets
-- -----------------------------------------------------------------------------

insert into public.pets (
  slug,
  name,
  species,
  description,
  story,
  tags,
  featured,
  visible,
  sort_order
)
values
  (
    'miso',
    'Miso',
    'Cat',
    'A watchful, quiet co worker with a talent for occupying exactly the space a laptop needs.',
    'Miso treats every work session like a ritual: first the inspection, then the stretch, then the long stare that somehow makes the room feel slower and better. This section is here because not every portfolio needs to act as if work is the only thing a person is made of.',
    array['calm','companion','sunlit afternoons'],
    true,
    true,
    1
  ),
  (
    'nori',
    'Nori',
    'Cat',
    'Equal parts chaos and charm, with the energy of a button nobody should have pressed.',
    'Nori is the opposite rhythm, fast, disruptive, completely sincere. Good for remembering that delight is sometimes irregular, loud, and unexpectedly useful in creative work.',
    array['playful','high energy','story magnet'],
    true,
    true,
    2
  ),
  (
    'tofu',
    'Tofu',
    'Cat',
    'The diplomat of the group. Soft presence, measured confidence, and suspiciously perfect timing.',
    'Tofu makes every room feel considered. That is probably why this profile leans more editorial than playful. The gallery should still belong to the same design world as the rest of the portfolio.',
    array['gentle','editorial','photogenic'],
    true,
    true,
    3
  )
on conflict (slug) do nothing;

insert into public.pet_images (pet_id, image_url, alt_text, caption, home_featured, sort_order)
select p.id, v.image_url, v.alt_text, v.caption, v.home_featured, v.sort_order
from public.pets p
join (
  values
    ('miso', '/previews/pets/miso-1.svg', 'Miso sun patch portrait', 'Sun patch portrait', true, 1),
    ('miso', '/previews/pets/miso-2.svg', 'Miso desk takeover', 'Desk takeover', false, 2),
    ('miso', '/previews/pets/miso-3.svg', 'Miso window watcher', 'Window watcher', false, 3),
    ('nori', '/previews/pets/nori-1.svg', 'Nori mid jump blur', 'Mid jump blur', true, 1),
    ('nori', '/previews/pets/nori-2.svg', 'Nori floor sprawl', 'Floor sprawl', false, 2),
    ('nori', '/previews/pets/nori-3.svg', 'Nori evening patrol', 'Evening patrol', false, 3),
    ('tofu', '/previews/pets/tofu-1.svg', 'Tofu monochrome profile', 'Monochrome profile', true, 1),
    ('tofu', '/previews/pets/tofu-2.svg', 'Tofu quiet curl', 'Quiet curl', false, 2),
    ('tofu', '/previews/pets/tofu-3.svg', 'Tofu night lamp frame', 'Night lamp frame', false, 3)
) as v(pet_slug, image_url, alt_text, caption, home_featured, sort_order)
  on v.pet_slug = p.slug
on conflict do nothing;
