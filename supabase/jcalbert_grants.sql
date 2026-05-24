-- Run this once in the Supabase SQL Editor to grant the jcalbert schema
-- the same access rights the public schema has.
--
-- IMPORTANT: Also go to Supabase Dashboard → Settings → API → "Extra schema
-- search paths" and add  jcalbert  to the list, then save.

begin;

-- 1. Grant schema-level usage
grant usage on schema jcalbert to anon, authenticated, service_role;

-- 2. Grant table access
grant select, insert, update, delete on jcalbert.location         to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tours            to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_images      to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_highlights  to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_activities  to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.messaging        to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.sales_report     to anon, authenticated, service_role;

-- 3. Grant sequence access (needed for auto-increment primary keys)
grant usage, select on all sequences in schema jcalbert to anon, authenticated, service_role;

-- 4. Enable Row Level Security on every table
alter table jcalbert.location        enable row level security;
alter table jcalbert.tours           enable row level security;
alter table jcalbert.tour_images     enable row level security;
alter table jcalbert.tour_highlights enable row level security;
alter table jcalbert.tour_activities enable row level security;
alter table jcalbert.messaging       enable row level security;
alter table jcalbert.sales_report    enable row level security;

-- 5. Open RLS policies (same pattern as public schema)
drop policy if exists "jcalbert public access location"        on jcalbert.location;
create policy "jcalbert public access location"
  on jcalbert.location for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tours"           on jcalbert.tours;
create policy "jcalbert public access tours"
  on jcalbert.tours for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_images"     on jcalbert.tour_images;
create policy "jcalbert public access tour_images"
  on jcalbert.tour_images for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_highlights" on jcalbert.tour_highlights;
create policy "jcalbert public access tour_highlights"
  on jcalbert.tour_highlights for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_activities" on jcalbert.tour_activities;
create policy "jcalbert public access tour_activities"
  on jcalbert.tour_activities for all to public using (true) with check (true);

drop policy if exists "jcalbert public access messaging"       on jcalbert.messaging;
create policy "jcalbert public access messaging"
  on jcalbert.messaging for all to public using (true) with check (true);

drop policy if exists "jcalbert public access sales_report"    on jcalbert.sales_report;
create policy "jcalbert public access sales_report"
  on jcalbert.sales_report for all to public using (true) with check (true);

commit;
