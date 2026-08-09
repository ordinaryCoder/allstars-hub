-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  ALLSTARS HUB — SEED ENTRYPOINT                                          ║
-- ║                                                                          ║
-- ║  This file is the canonical reference point for setting up a fresh       ║
-- ║  Supabase project. Run these two SQL files in order via the              ║
-- ║  Supabase SQL Editor (Dashboard → SQL Editor → New Query).               ║
-- ║                                                                          ║
-- ║  STEP 1 — Schema (run once per project)                                  ║
-- ║    File: prima/migrations/complete_schema_rls_functions.sql              ║
-- ║    Builds: enums, tables, indexes, unique constraints, foreign keys,     ║
-- ║            RLS policies, JWT helper functions, access token hook,        ║
-- ║            new-user trigger, and deletion utility.                       ║
-- ║                                                                          ║
-- ║  STEP 2 — Test Data (run on dev/staging only)                            ║
-- ║    File: snippets/backfill.sql                                           ║
-- ║    Inserts: academy, locations, sports, public users, auth users,        ║
-- ║             roles, coach assignments, players, parents, sessions.        ║
-- ║    All statements are idempotent (ON CONFLICT DO NOTHING).               ║
-- ║    Password for all test accounts: password123                           ║
-- ║                                                                          ║
-- ║  TEST ACCOUNTS                                                           ║
-- ║  ─────────────────────────────────────────────────────────────────────   ║
-- ║  admin@test.com        → admin role                                      ║
-- ║  coach.north@test.com  → coach role, assigned to North Turf              ║
-- ║  coach.south@test.com  → coach role, assigned to South Court             ║
-- ║  parent@test.com       → parent role, linked to player Liam North        ║
-- ║  player@test.com       → player role, self-registered at North Turf      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- NOTE: Prisma seed.ts (packages/database/prisma/seed.ts) is kept for
-- reference only and is marked obsolete. Use the SQL files above instead.


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║              ALLSTARS HUB — TEST DATA BACKFILL                           ║
-- ║                                                                          ║
-- ║  Run AFTER prisma migration deployment on a development/staging project. ║
-- ║  Inserts a complete set of test fixtures: academy, locations, sports,    ║
-- ║  users (public + auth), roles, coaches, players, parents, and sessions.  ║
-- ║                                                                          ║
-- ║  All passwords are:  password123                                         ║
-- ║  All UUIDs are fixed so this script is idempotent (ON CONFLICT DO NOTHING).║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- =======================================================
-- 1. ACADEMY
-- =======================================================

INSERT INTO academies (id, name, is_active)
VALUES ('867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'AllStars Academy', true)
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 2. LOCATIONS
-- =======================================================

INSERT INTO locations (id, academy_id, name, address) VALUES
  ('c10c0001-0000-4000-8000-000000000001', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'North Turf',   '123 North St'),
  ('c10c0002-0000-4000-8000-000000000002', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'South Court',  '456 South St')
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 3. SPORTS
-- =======================================================

INSERT INTO sports (id, academy_id, name) VALUES
  ('5b012345-0000-4000-8000-000000000001', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'Football')
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 4. PUBLIC USERS
-- Covers every role: admin, two coaches, parent, player.
-- status = ACTIVE so they can log in immediately without
-- admin approval.
-- =======================================================

INSERT INTO users (id, email, first_name, last_name, status) VALUES
  ('4470461b-df03-47f5-9c04-29663f13ba7a', 'admin@test.com',       'Admin',  'User',  'ACTIVE'),
  ('4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'coach.north@test.com', 'Coach',  'North', 'ACTIVE'),
  ('a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'coach.south@test.com', 'Coach',  'South', 'ACTIVE'),
  ('8b155308-9057-4c0e-b891-8398850866ad', 'parent@test.com',      'Parent', 'User',  'ACTIVE'),
  ('34488e91-c051-4d6c-ac28-10a7a774d04a', 'player@test.com',      'Player', 'User',  'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 5. ROLES & LOCATION ASSIGNMENTS
-- =======================================================

INSERT INTO user_academy_roles (user_id, academy_id, permissions) VALUES
  ('4470461b-df03-47f5-9c04-29663f13ba7a', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["admin"]'),
  ('4d9fe3e1-e9da-4552-b778-26f0b4f98445', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["coach"]'),
  ('a818b952-7bd6-4755-a53d-0dc6b62aa18c', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["coach"]'),
  ('8b155308-9057-4c0e-b891-8398850866ad', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["parent"]'),
  ('34488e91-c051-4d6c-ac28-10a7a774d04a', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["player"]')
ON CONFLICT (user_id, academy_id) DO NOTHING;

-- Coach → location assignments
INSERT INTO coach_locations (user_id, location_id) VALUES
  ('4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'c10c0001-0000-4000-8000-000000000001'), -- Coach North → North Turf
  ('a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'c10c0002-0000-4000-8000-000000000002')  -- Coach South → South Court
ON CONFLICT (user_id, location_id) DO NOTHING;


-- =======================================================
-- 6. PLAYERS
-- =======================================================

INSERT INTO players (id, academy_id, location_id, user_id, first_name, last_name, dob, is_active) VALUES
  -- North Turf
  ('7edcd21b-05f9-4d16-b251-82aeda6ade4f', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', NULL,                                   'Liam',   'North', '2015-01-01', true),
  ('f13b6320-1234-4a56-b789-0123456789ab', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', NULL,                                   'Noah',   'North', '2016-05-15', true),
  -- South Court
  ('d98a7231-1111-4a56-b789-0123456789ac', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0002-0000-4000-8000-000000000002', NULL,                                   'Emma',   'South', '2014-03-10', true),
  ('e57b8342-2222-4a56-b789-0123456789ad', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0002-0000-4000-8000-000000000002', NULL,                                   'Olivia', 'South', '2015-08-22', true),
  -- Self-registered player (linked to player@test.com user account)
  ('b00a0001-0000-4000-8000-000000000099', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', '34488e91-c051-4d6c-ac28-10a7a774d04a', 'Player', 'User',  '2012-06-10', true)
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 7. PARENT → PLAYER LINKS
-- =======================================================

INSERT INTO parent_player (parent_user_id, player_id) VALUES
  ('8b155308-9057-4c0e-b891-8398850866ad', '7edcd21b-05f9-4d16-b251-82aeda6ade4f') -- Parent → Liam North
ON CONFLICT (parent_user_id, player_id) DO NOTHING;


-- =======================================================
-- 8. SESSIONS (one per location for today — immediately
--    usable for attendance marking tests)
-- =======================================================

INSERT INTO sessions (id, academy_id, location_id, created_by, coach_id, start_time, end_time) VALUES
  -- Scheduled session: Coach North at North Turf (created by admin)
  ('5e111111-0000-4000-8000-000000000001',
   '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e',
   'c10c0001-0000-4000-8000-000000000001',
   '4470461b-df03-47f5-9c04-29663f13ba7a',
   '4d9fe3e1-e9da-4552-b778-26f0b4f98445',
   CURRENT_TIMESTAMP,
   CURRENT_TIMESTAMP + INTERVAL '3 hours'),
  -- Ad-hoc session: Coach North assigned to South Court (tests Rule 5 RLS visibility)
  ('5e222222-0000-4000-8000-000000000002',
   '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e',
   'c10c0002-0000-4000-8000-000000000002',
   '4470461b-df03-47f5-9c04-29663f13ba7a',
   '4d9fe3e1-e9da-4552-b778-26f0b4f98445',
   CURRENT_TIMESTAMP,
   CURRENT_TIMESTAMP + INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 9. SUPABASE AUTH USERS
-- Inserts directly into auth.users so test accounts can
-- sign in immediately without going through email confirm.
-- Password for all accounts: password123
-- =======================================================

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  ('00000000-0000-0000-0000-000000000000', '4470461b-df03-47f5-9c04-29663f13ba7a', 'authenticated', 'authenticated',
   'admin@test.com',       crypt('password123', gen_salt('bf', 10)),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'authenticated', 'authenticated',
   'coach.north@test.com', crypt('password123', gen_salt('bf', 10)),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'authenticated', 'authenticated',
   'coach.south@test.com', crypt('password123', gen_salt('bf', 10)),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '8b155308-9057-4c0e-b891-8398850866ad', 'authenticated', 'authenticated',
   'parent@test.com',      crypt('password123', gen_salt('bf', 10)),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '34488e91-c051-4d6c-ac28-10a7a774d04a', 'authenticated', 'authenticated',
   'player@test.com',      crypt('password123', gen_salt('bf', 10)),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')

ON CONFLICT (id) DO NOTHING;


-- =======================================================
-- 10. AUTH IDENTITIES (required for Supabase sign-in)
-- =======================================================

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
    gen_random_uuid(),
    id,
    format('{"sub":"%s","email":"%s"}', id, email)::jsonb,
    'email',
    id,
    now(), now(), now()
FROM auth.users
WHERE email IN (
    'admin@test.com',
    'coach.north@test.com',
    'coach.south@test.com',
    'parent@test.com',
    'player@test.com'
)
ON CONFLICT (provider, provider_id) DO NOTHING;
