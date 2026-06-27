-- Project content migration: normalize project long-form content into content_blocks.
-- Run this on an existing database after schema.sql/seed-content.sql.
-- It preserves challenge/approach/outcome columns for backward compatibility,
-- but updates content_blocks so the editor and project detail page can use blocks first.

update public.projects
set content_blocks = jsonb_build_array(
  jsonb_build_object('id','challenge-heading','type','heading','data',jsonb_build_object('level',2,'text','Challenge')),
  jsonb_build_object('id','challenge-body','type','paragraph','data',jsonb_build_object('html', format('<p>%s</p>', challenge))),
  jsonb_build_object('id','approach-heading','type','heading','data',jsonb_build_object('level',2,'text','Approach')),
  jsonb_build_object('id','approach-body','type','paragraph','data',jsonb_build_object('html', format('<p>%s</p>', approach))),
  jsonb_build_object('id','outcome-heading','type','heading','data',jsonb_build_object('level',2,'text','Outcome')),
  jsonb_build_object('id','outcome-body','type','paragraph','data',jsonb_build_object('html', format('<p>%s</p>', outcome))),
  jsonb_build_object('id','metrics-heading','type','heading','data',jsonb_build_object('level',2,'text','Highlights')),
  jsonb_build_object('id','metrics-list','type','list','data',jsonb_build_object('style','unordered','items', metrics_json))
)
where slug in (
  'sentinel-command-center',
  'estate-clarity-workbench',
  'pulse-design-language',
  'atlas-client-portal',
  'ember-notes-lab'
);
