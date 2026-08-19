-- ============================================================================
-- Jcalbert Travel & Tours — full schema recreation for a NEW Supabase project
-- ============================================================================
-- Run this once in the new project's SQL Editor (Supabase Dashboard > SQL
-- Editor > New query > paste all > Run).
--
-- IMPORTANT — after running this script:
--   Supabase Dashboard > Project Settings > API > "Exposed schemas"
--   (a.k.a. "Extra search path") — add  jcalbert  to the list and Save.
--   The app connects with `db: { schema: 'jcalbert' }`, so PostgREST will
--   reject every request until "jcalbert" is added there.
--
-- Table/column names below were verified against the live query code in
-- api/tours.ts, api/reviews.ts, api/locations.ts, api/message.ts, api/book.ts
-- (and their server.ts twins), not just the older seed script in this repo.
-- ============================================================================

begin;

create schema if not exists jcalbert;

-- ----------------------------------------------------------------------------
-- location  — powers the "Destination" dropdown (/api/locations)
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.location (
  id bigserial primary key,
  location_name text not null unique,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tours  — /api/tours (select *)
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.tours (
  id text primary key,
  name text not null,
  location text not null check (location in ('El Nido', 'Puerto Princesa', 'Coron', 'Port Barton')),
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2),
  is_best_seller boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tour_images  — column is "tours_images_2" (verified in api/tours.ts,
-- src/lib/tours.ts). image_url was retired per supabase/migrate_tour_images_2.sql.
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.tour_images (
  id bigserial primary key,
  tour_id text not null references jcalbert.tours(id) on delete cascade,
  tours_images_2 text,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tour_id, sort_order)
);

create table if not exists jcalbert.tour_highlights (
  id bigserial primary key,
  tour_id text not null references jcalbert.tours(id) on delete cascade,
  highlight text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tour_id, sort_order)
);

create table if not exists jcalbert.tour_activities (
  id bigserial primary key,
  tour_id text not null references jcalbert.tours(id) on delete cascade,
  activity text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tour_id, sort_order)
);

-- ----------------------------------------------------------------------------
-- reviews  — /api/reviews only reads id, reviews_photo
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.reviews (
  id bigserial primary key,
  reviews_photo text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- messaging  — /api/message insert
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.messaging (
  id bigserial primary key,
  customer_booking_id text,
  full_name text not null,
  contact_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- sales_report  — /api/book insert (booking_id, reservation_fee, total_amount)
-- ----------------------------------------------------------------------------
create table if not exists jcalbert.sales_report (
  id bigserial primary key,
  booking_id bigint not null,
  reservation_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_tour_images_tour_id on jcalbert.tour_images (tour_id);
create index if not exists idx_tour_highlights_tour_id on jcalbert.tour_highlights (tour_id);
create index if not exists idx_tour_activities_tour_id on jcalbert.tour_activities (tour_id);
create index if not exists idx_messaging_booking_id on jcalbert.messaging (customer_booking_id);
create index if not exists idx_sales_report_booking_id on jcalbert.sales_report (booking_id);
create index if not exists idx_sales_report_created_at on jcalbert.sales_report (created_at);

-- ----------------------------------------------------------------------------
-- Grants (app connects with the service role key, but grant anon/authenticated
-- too since RLS policies below allow "public" access on all of them)
-- ----------------------------------------------------------------------------
grant usage on schema jcalbert to anon, authenticated, service_role;

grant select, insert, update, delete on jcalbert.location         to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tours            to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_images      to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_highlights  to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.tour_activities  to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.reviews          to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.messaging        to anon, authenticated, service_role;
grant select, insert, update, delete on jcalbert.sales_report     to anon, authenticated, service_role;

grant usage, select on all sequences in schema jcalbert to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- RLS — open policies matching the existing jcalbert_grants.sql pattern.
-- The app uses the service role key server-side (bypasses RLS anyway), but we
-- enable + open it in case the anon key is ever used directly from the client.
-- ----------------------------------------------------------------------------
alter table jcalbert.location        enable row level security;
alter table jcalbert.tours           enable row level security;
alter table jcalbert.tour_images     enable row level security;
alter table jcalbert.tour_highlights enable row level security;
alter table jcalbert.tour_activities enable row level security;
alter table jcalbert.reviews         enable row level security;
alter table jcalbert.messaging       enable row level security;
alter table jcalbert.sales_report    enable row level security;

drop policy if exists "jcalbert public access location" on jcalbert.location;
create policy "jcalbert public access location"
  on jcalbert.location for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tours" on jcalbert.tours;
create policy "jcalbert public access tours"
  on jcalbert.tours for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_images" on jcalbert.tour_images;
create policy "jcalbert public access tour_images"
  on jcalbert.tour_images for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_highlights" on jcalbert.tour_highlights;
create policy "jcalbert public access tour_highlights"
  on jcalbert.tour_highlights for all to public using (true) with check (true);

drop policy if exists "jcalbert public access tour_activities" on jcalbert.tour_activities;
create policy "jcalbert public access tour_activities"
  on jcalbert.tour_activities for all to public using (true) with check (true);

drop policy if exists "jcalbert public access reviews" on jcalbert.reviews;
create policy "jcalbert public access reviews"
  on jcalbert.reviews for all to public using (true) with check (true);

drop policy if exists "jcalbert public access messaging" on jcalbert.messaging;
create policy "jcalbert public access messaging"
  on jcalbert.messaging for all to public using (true) with check (true);

drop policy if exists "jcalbert public access sales_report" on jcalbert.sales_report;
create policy "jcalbert public access sales_report"
  on jcalbert.sales_report for all to public using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Seed: destinations
-- ----------------------------------------------------------------------------
insert into jcalbert.location (location_name)
values ('El Nido'), ('Puerto Princesa'), ('Coron'), ('Port Barton')
on conflict (location_name) do nothing;

-- ----------------------------------------------------------------------------
-- Seed: tours
-- ----------------------------------------------------------------------------
insert into jcalbert.tours (id, name, location, description, price, original_price, is_best_seller)
values
  ('t1', 'El Nido Tour A: Lagoons and Beaches', 'El Nido', 'Explore the famous Big Lagoon, Secret Lagoon, and Shimizu Island. Perfect for kayaking and snorkeling.', 1200, 1500, true),
  ('t2', 'El Nido Tour B: Caves and Coves', 'El Nido', 'Discover hidden caves and beautiful coves including Snake Island and Cudugnon Cave.', 1200, 1600, false),
  ('t3', 'El Nido Tour C: Hidden Beaches and Shrines', 'El Nido', 'Visit the most beautiful beaches in El Nido including Hidden Beach and Matinloc Shrine.', 1300, 1800, true),
  ('t4', 'El Nido Tour D: Cadlao Lagoons', 'El Nido', 'A more relaxed tour focusing on the beautiful lagoons of Cadlao Island.', 1100, 1500, true),
  ('t5', 'Underground River Tour w/ buffet lunch', 'Puerto Princesa', 'Explore one of the New 7 Wonders of Nature in Puerto Princesa.', 2150, 2700, true),
  ('t6', 'Puerto Princesa City Tour', 'Puerto Princesa', 'Running Tour at Baywalk, Plaza Cuartel, Cathedral, Mitras Ranch, Bakers Hill, Butterfly Garden/Crocodile Farm, and Pasalubong Centers', 750, 1000, true),
  ('t7', 'Honda Bay Island Hopping w/ lunch', 'Puerto Princesa', 'Pambato reef, Luli Island/Starfish Island and Cowrie Island', 1750, 2000, true),
  ('t8', 'Firefly Watching w/ dinner', 'Puerto Princesa', 'A night filled with firefly magic', 1600, 2000, true),
  ('t9', 'Port Barton Promo Tours', 'Port Barton', 'Port Barton: Where time slows and paradise begins.', 1500, 1900, true),
  ('t91', 'San Vicente Land Tour', 'Port Barton', 'Your Gateway to Hidden Paradise.', 1800, 2100, true),
  ('t10', 'Coron Tour A', 'Coron', 'Where Every Island Feels Like Paradise.', 1100, 1500, true),
  ('t11', 'Coron Tour B', 'Coron', 'Where Every Island Feels Like Paradise.', 1400, 1900, true),
  ('t12', 'Coron Tour C', 'Coron', 'Where Every Island Feels Like Paradise.', 1800, 2100, true),
  ('t13', 'Safari', 'Coron', 'Where Adventure Meets the Wild.', 1800, 2100, true),
  ('t14', 'Coron Town Tour', 'Coron', 'A Deeper Look at Coron''s Local Charm.', 900, 1250, true)
on conflict (id) do update
set
  name = excluded.name,
  location = excluded.location,
  description = excluded.description,
  price = excluded.price,
  original_price = excluded.original_price,
  is_best_seller = excluded.is_best_seller;

-- ----------------------------------------------------------------------------
-- Seed: tour_images
-- ----------------------------------------------------------------------------
insert into jcalbert.tour_images (tour_id, tours_images_2, label, sort_order)
values
  ('t1', '/images/tours/tourA_BigLagoon.png', 'Big Lagoon', 1),
  ('t1', '/images/tours/tourA_SecretLagoon.png', 'Secret Lagoon', 2),
  ('t1', '/images/tours/tourA_PayongPayongBeach.png', 'Payong-Payong Beach', 3),
  ('t1', '/images/tours/tourA_SevenCommandoBeach.png', 'Seven Commando Beach', 4),
  ('t1', '/images/tours/tourA_ShimizuIsland.png', 'Shimizu Island', 5),
  ('t2', '/images/tours/tourB_CathedralCave.jpg', 'Cathedral Cave', 1),
  ('t2', '/images/tours/tourB_CodugnonCave.jpg', 'Codugnon Cave', 2),
  ('t2', '/images/tours/tourB_EntalulaIsland.webp', 'Entulala Island', 3),
  ('t2', '/images/tours/tourB_PinagbuyutanIsland.webp', 'Pinagbuyutan Island', 4),
  ('t2', '/images/tours/tourB_SnakeIsland.jpg', 'Snake Island', 5),
  ('t3', '/images/tours/tourC_HelicopterIsland.webp', 'Helicopter Island', 1),
  ('t3', '/images/tours/tourC_HiddenBeach.webp', 'Hidden Beach', 2),
  ('t3', '/images/tours/tourC_MatinlocShrineArea.jpg', 'Matinloc Shrine Area', 3),
  ('t3', '/images/tours/tourC_SecretBeach.webp', 'Secret Beach', 4),
  ('t3', '/images/tours/tourC_TapiutanIsland.jpg', 'Tapiutan Island', 5),
  ('t4', '/images/tours/tourD_CadlaoLagoon.jpg', 'Cadlao Lagoon', 1),
  ('t4', '/images/tours/tourD_IpilBeach.webp', 'Ipil Beach', 2),
  ('t4', '/images/tours/tourD_ParadiseBeach.jpg', 'Paradise Beach', 3),
  ('t4', '/images/tours/tourD_PasandiganBeach.jpg', 'Pasandigan Beach', 4),
  ('t4', '/images/tours/tourD_SmallLagoon.jpg', 'Small Lagoon', 5),
  ('t5', '/images/tours/ppc_undergroundriver.jpg', 'Underground River', 1),
  ('t5', '/images/tours/ppc_underground.jpg', 'Underground River', 2),
  ('t5', '/images/tours/ppc_ugong2.jpg', 'Ugong', 3),
  ('t5', '/images/tours/ppc_ugong3.jpg', 'Ugong', 4),
  ('t5', '/images/tours/ppc_Ugong.jpg', 'Ugong', 5),
  ('t6', '/images/tours/city_crocodilefarm.jpg', 'Crocodile Farm', 1),
  ('t6', '/images/tours/city_bakershill.jpg', 'Bakers Hill', 2),
  ('t6', '/images/tours/city_mitrasranch.jpg', 'Mitras Ranch', 3),
  ('t6', '/images/tours/city_Cathedral.jpg', 'Cathedral', 4),
  ('t6', '/images/tours/city_Baywalk.jpg', 'Bay Walk', 5),
  ('t6', '/images/tours/city_Butterfly.jpg', 'Butterfly Garden', 6),
  ('t6', '/images/tours/city_Pasalubong.jpg', 'Pasalubong', 7),
  ('t6', '/images/tours/city_Plaza.jpg', 'Plaza', 8),
  ('t7', '/images/tours/hb_Island1.jpg', 'Honda Bay Island', 1),
  ('t7', '/images/tours/hb_Island2.jpg', 'Honda Bay Island', 2),
  ('t7', '/images/tours/hb_Starfish.jpg', 'Startfish', 3),
  ('t7', '/images/tours/hb_1.jpg', 'Food', 4),
  ('t7', '/images/tours/hb_2.jpg', 'Food', 5),
  ('t7', '/images/tours/hb_3.jpg', 'Food', 6),
  ('t7', '/images/tours/hb_4.jpg', 'Food', 7),
  ('t7', '/images/tours/hb_5.jpg', 'Food', 8),
  ('t8', '/images/tours/ff_1.jpg', 'Firefly Watching', 1),
  ('t8', '/images/tours/ff_2.jpg', 'Firefly Watching', 2),
  ('t8', '/images/tours/ff_3.jpg', 'Food', 3),
  ('t8', '/images/tours/ff_4.jpg', 'Food', 4),
  ('t8', '/images/tours/ff_5.jpg', 'Food', 5),
  ('t8', '/images/tours/ff_6.jpg', 'Food', 6),
  ('t9', '/images/tours/br_TurtleSpot.jpg', 'Turtle Spot', 1),
  ('t9', '/images/tours/br_TwinReef.jpg', 'Twin Reef', 2),
  ('t9', '/images/tours/br_SandBar.jpg', 'Sand Bar', 3),
  ('t9', '/images/tours/br_FantasticReef.jpg', 'Fantastic Reef', 4),
  ('t9', '/images/tours/br_MaximaIsland.jpg', 'Maxima Island', 5),
  ('t9', '/images/tours/br_PeñaPlata.jpg', 'Peña Plata', 6),
  ('t91', '/images/tours/br_landtour.jpg', 'Land Tour', 1),
  ('t10', '/images/tours/cr_TourA.jpg', 'Tour A', 1),
  ('t10', '/images/tours/cr_TourA_KayanganLake.webp', 'Kayangan Lake', 2),
  ('t10', '/images/tours/cr_TourA_AtuayanBeach.jpg', 'Atuayan Beach', 3),
  ('t10', '/images/tours/cr_TourA_CoralGarden.webp', 'Coral Garden', 4),
  ('t10', '/images/tours/cr_TourA_CYCBeach.jpg', 'CYC Beach', 5),
  ('t10', '/images/tours/cr_TourA_QuinReef.webp', 'Quin Reef', 6),
  ('t11', '/images/tours/cr_TourB.jpg', 'Tour B', 1),
  ('t12', '/images/tours/cr_TourC.jpg', 'Tour C', 1),
  ('t13', '/images/tours/cr_Safari.jpg', 'Tour C', 1),
  ('t14', '/images/tours/cr_TownTour.jpg', 'Tour C', 1)
on conflict (tour_id, sort_order) do update
set
  tours_images_2 = excluded.tours_images_2,
  label = excluded.label;

-- ----------------------------------------------------------------------------
-- Seed: tour_highlights
-- ----------------------------------------------------------------------------
insert into jcalbert.tour_highlights (tour_id, highlight, sort_order)
values
  ('t1', 'Big Lagoon', 1),
  ('t1', 'Secret Lagoon', 2),
  ('t1', 'Shimizu Island', 3),
  ('t1', 'Seven Commando Beach', 4),
  ('t1', 'Payong-Payong Beach', 5),
  ('t2', 'Entalula Island', 1),
  ('t2', 'Codugnon Cave', 2),
  ('t2', 'Snake Island', 3),
  ('t2', 'Cathedral Cave', 4),
  ('t2', 'Pinagbuyutan Island', 5),
  ('t3', 'Secret Beach', 1),
  ('t3', 'Matinloc Shrine', 2),
  ('t3', 'Hidden Beach', 3),
  ('t3', 'Tapuitan Island', 4),
  ('t3', 'Helicopter Island', 5),
  ('t4', 'Small Lagoon', 1),
  ('t4', 'Paradise Beach', 2),
  ('t4', 'Pasandigan Beach', 3),
  ('t4', 'Cadlao Lagoon', 4),
  ('t4', 'Ipil Beach', 5),
  ('t5', 'Underground River', 1),
  ('t5', 'Ugong', 2),
  ('t5', 'Zipline', 3),
  ('t5', 'Lunch buffet', 4),
  ('t6', 'Crocodile Farm', 1),
  ('t6', 'Bakers Hill', 2),
  ('t6', 'Mitras Ranch', 3),
  ('t6', 'Cathedral', 4),
  ('t6', 'Bay Walk', 5),
  ('t6', 'Butterfly Garden', 6),
  ('t6', 'Plaza', 7),
  ('t7', 'Honda Bay Island Hopping', 1),
  ('t7', 'Startfish', 2),
  ('t7', 'Foods', 3),
  ('t8', 'Honda Bay Island Hopping', 1),
  ('t8', 'Startfish', 2),
  ('t8', 'Foods', 3),
  ('t9', 'Turtle Spot', 1),
  ('t9', 'Twin Reef', 2),
  ('t9', 'Sand Bar', 3),
  ('t9', 'Fantastic Reef', 4),
  ('t9', 'Maxima Island', 5),
  ('t9', 'Peña Plata', 6),
  ('t91', 'Long Beach', 1),
  ('t91', 'Bato ni Ningning', 2),
  ('t91', 'San Vic View Point', 3),
  ('t91', 'Hundred steps', 4),
  ('t91', 'Bigaho Waterfalls', 5),
  ('t91', 'Gilligans Port', 6),
  ('t91', 'Barton Beach', 7),
  ('t10', 'Kayangan Lake', 1),
  ('t10', 'Quin Reef', 2),
  ('t10', 'CYC Beach', 3),
  ('t10', 'Coral Garden', 4),
  ('t10', 'Atwayan Beach', 5),
  ('t11', 'Barracuda Lake', 1),
  ('t11', 'Twin Lagoon', 2),
  ('t11', 'Skeleton Wreck', 3),
  ('t11', 'Malwawey Beach', 4),
  ('t11', 'Reef Garden', 5),
  ('t12', 'Malcapuya Island', 1),
  ('t12', 'Ditaytayan Island', 2),
  ('t12', 'Coco Beach', 3),
  ('t13', 'Malcapuya Island', 1),
  ('t13', 'Ditaytayan Island', 2),
  ('t13', 'Coco Beach', 3),
  ('t14', 'Souvenir Shop', 1),
  ('t14', 'Lualhati Park', 2),
  ('t14', 'Town Plaza', 3),
  ('t14', 'St. Augustine Church', 4),
  ('t14', 'Mt. Tapyas', 5),
  ('t14', 'Cashew Factory', 6),
  ('t14', 'Maquinit Hot Spring', 7)
on conflict (tour_id, sort_order) do update
set
  highlight = excluded.highlight;

-- ----------------------------------------------------------------------------
-- Seed: tour_activities
-- ----------------------------------------------------------------------------
insert into jcalbert.tour_activities (tour_id, activity, sort_order)
values
  ('t91', 'Long Beach', 1),
  ('t91', 'Bato ni Ningning', 2),
  ('t91', 'San Vic View Point', 3),
  ('t91', 'Hundred steps', 4),
  ('t91', 'Bigaho Waterfalls', 5),
  ('t91', 'Gilligans Port', 6),
  ('t91', 'Barton Beach', 7),
  ('t91', 'Motorcycle/Tuktuk or Tricycle', 8),
  ('t91', 'Tourguide', 9),
  ('t10', 'Swimming', 1),
  ('t10', 'Kayaking', 2),
  ('t10', 'Snorkeling', 3),
  ('t10', 'Picture Taking', 4),
  ('t10', 'Free Lunch', 5),
  ('t11', 'Swimming', 1),
  ('t11', 'Kayaking', 2),
  ('t11', 'Snorkeling', 3),
  ('t11', 'Picture Taking', 4),
  ('t11', 'Free Lunch', 5),
  ('t12', 'Swimming', 1),
  ('t12', 'Kayaking', 2),
  ('t12', 'Snorkeling', 3),
  ('t12', 'Picture Taking', 4),
  ('t12', 'Free Lunch', 5)
on conflict (tour_id, sort_order) do update
set
  activity = excluded.activity;

commit;
