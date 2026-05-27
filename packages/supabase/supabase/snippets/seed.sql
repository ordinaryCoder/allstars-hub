-- 1. Create Academy
INSERT INTO academies (id, name) 
VALUES ('867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', 'Test Academy');

-- 2. Create Users (IDs must match Supabase auth.users for real login)
INSERT INTO users (id, email, first_name, last_name) VALUES 
('4470461b-df03-47f5-9c04-29663f13ba7a', 'admin@test.com', 'Admin', 'User'),
('4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'coach@test.com', 'Coach', 'User'),
('34488e91-c051-4d6c-ac28-10a7a774d04a', 'player@test.com', 'Player', 'User'),
('8b155308-9057-4c0e-b891-8398850866ad', 'parent@test.com', 'Parent', 'User'),
('4f4a7dd4-8c12-4bb7-9a54-553da21b0965', 'super@test.com', 'Super', 'Admin'),
('a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'dual@test.com', 'Dual', 'User');

-- 3. Assign Roles and Permissions
INSERT INTO user_academy_roles (user_id, academy_id, permissions) VALUES
('4470461b-df03-47f5-9c04-29663f13ba7a', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["admin"]'),
('4d9fe3e1-e9da-4552-b778-26f0b4f98445', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["coach"]'),
('34488e91-c051-4d6c-ac28-10a7a774d04a', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["player"]'),
('8b155308-9057-4c0e-b891-8398850866ad', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["parent"]'),
('4f4a7dd4-8c12-4bb7-9a54-553da21b0965', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["superadmin"]'),
('a818b952-7bd6-4755-a53d-0dc6b62aa18c', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '["admin", "coach"]');

-- 4. Create Player Record (for Player login and Parent link)
INSERT INTO players (id, academy_id, user_id, first_name, last_name, dob) VALUES
('7edcd21b-05f9-4d16-b251-82aeda6ade4f', '867d3e6c-7e3e-4f3d-8f3e-7e3e4f3d8f3e', '8b155308-9057-4c0e-b891-8398850866ad', 'Junior', 'Player', '2015-01-01');

-- 5. Link Parent to Player
INSERT INTO parent_player (parent_user_id, player_id) VALUES
('8b155308-9057-4c0e-b891-8398850866ad', '7edcd21b-05f9-4d16-b251-82aeda6ade4f');

-- 1. Insert into Auth Users (Hashed passwords)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
('00000000-0000-0000-0000-000000000000', '4470461b-df03-47f5-9c04-29663f13ba7a', 'authenticated', 'authenticated', 'admin@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '4d9fe3e1-e9da-4552-b778-26f0b4f98445', 'authenticated', 'authenticated', 'coach@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '34488e91-c051-4d6c-ac28-10a7a774d04a', 'authenticated', 'authenticated', 'player@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '8b155308-9057-4c0e-b891-8398850866ad', 'authenticated', 'authenticated', 'parent@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '4f4a7dd4-8c12-4bb7-9a54-553da21b0965', 'authenticated', 'authenticated', 'super@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', 'a818b952-7bd6-4755-a53d-0dc6b62aa18c', 'authenticated', 'authenticated', 'dual@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

-- 2. Add Identities (With provider_id fix)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    id, 
    format('{"sub":"%s","email":"%s"}', id, email)::jsonb, 
    'email', 
    id, -- provider_id is the user id for email provider in modern Supabase
    now(), 
    now(), 
    now()
FROM auth.users
WHERE email LIKE '%@test.com';