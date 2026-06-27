-- Add editable pets gallery support.
-- Run this on an existing database after the base schema.
-- This adds a single home-featured image marker per pet.

alter table public.pet_images
add column if not exists home_featured boolean not null default false;

with ranked_images as (
  select
    id,
    pet_id,
    row_number() over (partition by pet_id order by sort_order asc, created_at asc, id asc) as image_rank
  from public.pet_images
),
featured_exists as (
  select pet_id, bool_or(home_featured) as has_featured
  from public.pet_images
  group by pet_id
)
update public.pet_images pi
set home_featured = case
  when coalesce(fe.has_featured, false) then pi.home_featured
  when ri.image_rank = 1 then true
  else false
end,
updated_at = now()
from ranked_images ri
left join featured_exists fe on fe.pet_id = ri.pet_id
where pi.id = ri.id;
