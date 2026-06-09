----- Fresh seed data v2

-- =======================================================
-- 1. ACADEMY & ASSETS (Locations, Sports)
-- =======================================================
INSERT INTO academies (id, name, is_active) 
VALUES ('867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'AllStars Academy', true);

INSERT INTO locations (id, academy_id, name, address) VALUES 
('c10c0001-0000-4000-8000-000000000001', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'North Turf', '123 North St'),
('c10c0002-0000-4000-8000-000000000002', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'South Court', '456 South St');

INSERT INTO sports (id, academy_id, name) VALUES 
('5b012345-0000-4000-8000-000000000001', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'Football');

-- =======================================================
-- 2. PUBLIC USERS
-- =======================================================
INSERT INTO users (id, email, first_name, last_name, status) VALUES 
('4470461b-df03-47f5-9c04-29663f13ba7a', 'admin@test.com', 'Admin', 'User', 'ACTIVE'),
('4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'coach.north@test.com', 'Coach', 'North', 'ACTIVE'),
('a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'coach.south@test.com', 'Coach', 'South', 'ACTIVE'),
('8b155308-9057-4c0e-b891-8398850866ad', 'parent@test.com', 'Parent', 'User', 'ACTIVE');

-- =======================================================
-- 3. ROLES & LOCATION ASSIGNMENTS (The New Architecture)
-- =======================================================
INSERT INTO user_academy_roles (user_id, academy_id, permissions) VALUES
('4470461b-df03-47f5-9c04-29663f13ba7a', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["admin"]'),
('4d9fe3e1-e9da-4552-b778-26f0b4f98445', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["coach"]'),
('a818b952-7bd6-4755-a53d-0dc6b62aa18c', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["coach"]'),
('8b155308-9057-4c0e-b891-8398850866ad', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["parent"]');

-- NEW: Assign Coaches to specific locations
INSERT INTO coach_locations (user_id, location_id) VALUES
('4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'c10c0001-0000-4000-8000-000000000001'), -- Coach North -> North Turf
('a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'c10c0002-0000-4000-8000-000000000002'); -- Coach South -> South Court

-- =======================================================
-- 4. PLAYERS & PARENTS (With location_id)
-- =======================================================
INSERT INTO players (id, academy_id, location_id, first_name, last_name, dob, is_active) VALUES
-- 2 Players in North Turf
('7edcd21b-05f9-4d16-b251-82aeda6ade4f', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', 'Liam', 'North', '2015-01-01', true),
('f13b6320-1234-4a56-b789-0123456789ab', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', 'Noah', 'North', '2016-05-15', true),
-- 2 Players in South Court
('d98a7231-1111-4a56-b789-0123456789ac', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0002-0000-4000-8000-000000000002', 'Emma', 'South', '2014-03-10', true),
('e57b8342-2222-4a56-b789-0123456789ad', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0002-0000-4000-8000-000000000002', 'Olivia', 'South', '2015-08-22', true);

INSERT INTO parent_player (parent_user_id, player_id) VALUES
('8b155308-9057-4c0e-b891-8398850866ad', '7edcd21b-05f9-4d16-b251-82aeda6ade4f'); -- Parent linked to Liam North

-- =======================================================
-- 5. SESSIONS (Testing Ad-hoc & Normal)
-- =======================================================
INSERT INTO sessions (id, academy_id, location_id, created_by, coach_id, start_time, end_time) VALUES
-- Normal Session: Coach North at North Turf
('5e111111-0000-4000-8000-000000000001', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0001-0000-4000-8000-000000000001', '4470461b-df03-47f5-9c04-29663f13ba7a', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hours'),
-- Ad-Hoc Session: Coach North assigned to South Court (Tests Rule 5 RLS visibility)
('5e222222-0000-4000-8000-000000000002', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'c10c0002-0000-4000-8000-000000000002', '4470461b-df03-47f5-9c04-29663f13ba7a', '4d9fe3e1-e9da-4552-b778-26f0b4f98445', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hours');

-- =======================================================
-- 6. SUPABASE AUTH INTEGRATION (Strict Cost 10)
-- =======================================================
-- Insert into Auth Users (Password is 'password123')
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
('00000000-0000-0000-0000-000000000000', '4470461b-df03-47f5-9c04-29663f13ba7a', 'authenticated', 'authenticated', 'admin@test.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'authenticated', 'authenticated', 'coach.north@test.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'authenticated', 'authenticated', 'coach.south@test.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '8b155308-9057-4c0e-b891-8398850866ad', 'authenticated', 'authenticated', 'parent@test.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

-- Add Identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    id, 
    format('{"sub":"%s","email":"%s"}', id, email)::jsonb, 
    'email', 
    id, 
    now(), 
    now(), 
    now()
FROM auth.users
WHERE email LIKE '%@test.com'
ON CONFLICT (provider, provider_id) DO NOTHING;

