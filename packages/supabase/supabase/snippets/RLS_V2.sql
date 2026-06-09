-- =======================================================
-- RLS Policies
-- =======================================================
-- =======================================================
-- 1. HELPER FUNCTIONS (JWT Extractors)
-- =======================================================

CREATE OR REPLACE FUNCTION current_academy_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'academy_id', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '00000000-0000-0000-0000-000000000000')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'roles') ? 'admin', false);
$$ LANGUAGE sql STABLE;


-- =======================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =======================================================

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;


-- =======================================================
-- 3. FLAT STRUCTURAL POLICIES (Academies, Sports, Locations, Batches)
-- =======================================================

-- Academies
CREATE POLICY "Tenant Isolation: Academies" ON academies 
  USING (id = current_academy_id());

-- Sports
CREATE POLICY "Tenant Isolation: sports Select" ON sports FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: sports" ON sports FOR ALL USING (academy_id = current_academy_id() AND is_admin()) WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Locations (All academy members can read, Admin writes)
CREATE POLICY "Tenant Isolation: locations Select" ON locations FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: locations" ON locations FOR ALL USING (academy_id = current_academy_id() AND is_admin()) WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Batches (All academy members can read, Admin writes)
CREATE POLICY "Tenant Isolation: batches Select" ON batches FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: batches" ON batches FOR ALL USING (academy_id = current_academy_id() AND is_admin()) WITH CHECK (academy_id = current_academy_id() AND is_admin());


-- =======================================================
-- 4. CORE ENTITIES (Players, Sessions, Attendance, Goals)
-- =======================================================

-- Players Select Access (Time-Bound Ad-Hoc Access to Coach)
CREATE POLICY "Tenant Isolation: Players Select" ON players FOR SELECT 
  USING (
    academy_id = current_academy_id() AND (
      is_admin() 
      -- Permanent access to primary assigned locations
      OR location_id IN (SELECT location_id FROM coach_locations WHERE user_id = current_user_id()) 
      -- Temporary access to Ad-Hoc locations (Expires 24 hours after session end time for offline sync buffer)
      OR location_id IN (
          SELECT location_id FROM sessions 
          WHERE coach_id = current_user_id() 
          AND end_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      ) 
      -- Self & Parent views
      OR user_id = current_user_id() 
      OR EXISTS (SELECT 1 FROM parent_player pp WHERE pp.player_id = players.id AND pp.parent_user_id = current_user_id())
    )
  );
CREATE POLICY "Admin Modify: Players" ON players FOR ALL USING (academy_id = current_academy_id() AND is_admin()) WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Sessions (Rule 3, 4, 5)
CREATE POLICY "Tenant Isolation: Sessions Select" ON sessions FOR SELECT 
  USING (
    academy_id = current_academy_id() AND (
      is_admin() 
      OR created_by = current_user_id()
      OR coach_id = current_user_id() -- Rule 5
      OR location_id IN (SELECT location_id FROM coach_locations WHERE user_id = current_user_id()) -- Rule 3
    )
  );

-- Allow Coaches and Admins to CREATE sessions
CREATE POLICY "Sessions Insert" ON sessions FOR INSERT 
  WITH CHECK (academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id()));

-- Allow ONLY Admins to UPDATE sessions
CREATE POLICY "Sessions Update" ON sessions FOR UPDATE 
  USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Allow ONLY Admins to DELETE sessions
CREATE POLICY "Sessions Delete" ON sessions FOR DELETE 
  USING (academy_id = current_academy_id() AND is_admin());


-- Attendance
CREATE POLICY "Tenant Isolation: Attendance Select" ON attendance FOR SELECT 
  USING (
    academy_id = current_academy_id() AND (
      is_admin()
      OR marked_by = current_user_id()
      OR session_id IN (SELECT id FROM sessions WHERE coach_id = current_user_id() OR location_id IN (SELECT location_id FROM coach_locations WHERE user_id = current_user_id()))
      OR EXISTS (SELECT 1 FROM parent_player pp WHERE pp.player_id = attendance.player_id AND pp.parent_user_id = current_user_id())
      OR player_id IN (SELECT id FROM players WHERE user_id = current_user_id())
    )
  );

-- Allow Coaches and Admins to SUBMIT (Insert) attendance from offline mode
CREATE POLICY "Attendance Insert" ON attendance FOR INSERT 
  WITH CHECK (academy_id = current_academy_id() AND (is_admin() OR marked_by = current_user_id()));

-- Allow ONLY Admins to UPDATE historical attendance
CREATE POLICY "Attendance Update" ON attendance FOR UPDATE 
  USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Allow ONLY Admins to DELETE historical attendance
CREATE POLICY "Attendance Delete" ON attendance FOR DELETE 
  USING (academy_id = current_academy_id() AND is_admin());

-- Goals
CREATE POLICY "Tenant Isolation: goals Select" ON goals FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = goals.session_id AND sessions.academy_id = current_academy_id()));
CREATE POLICY "Modify: goals" ON goals FOR ALL 
  USING (is_admin() OR EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND (sessions.created_by = current_user_id() OR sessions.coach_id = current_user_id())))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND (sessions.created_by = current_user_id() OR sessions.coach_id = current_user_id())));


-- =======================================================
-- 5. JUNCTION & ROLE TABLES
-- =======================================================

-- Users (Fixed Admin Create Block)
CREATE POLICY "Tenant Isolation: users Select" ON users FOR SELECT
  USING (
    id = current_user_id()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM user_academy_roles 
      WHERE user_academy_roles.user_id = users.id 
      AND user_academy_roles.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Modify: users" ON users FOR ALL
  USING (id = current_user_id() OR is_admin())
  WITH CHECK (id = current_user_id() OR is_admin());

-- User Academy Roles
CREATE POLICY "Tenant Isolation: user_academy_roles Select" ON user_academy_roles FOR SELECT
  USING (academy_id = current_academy_id() OR user_id = current_user_id());
CREATE POLICY "Admin Modify: user_academy_roles" ON user_academy_roles FOR ALL 
  USING (academy_id = current_academy_id() AND is_admin()) WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Coach Locations
CREATE POLICY "Tenant Isolation: coach_locations Select" ON coach_locations FOR SELECT
  USING (is_admin() OR user_id = current_user_id());
CREATE POLICY "Admin Modify: coach_locations" ON coach_locations FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Parent Player
CREATE POLICY "Tenant Isolation: parent_player Select" ON parent_player FOR SELECT
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = parent_player.player_id AND players.academy_id = current_academy_id()));
CREATE POLICY "Admin Modify: parent_player" ON parent_player FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Session Batches (Phase 2 readiness)
CREATE POLICY "Tenant Isolation: session_batches Select" ON session_batches FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_batches.session_id AND s.academy_id = current_academy_id()));
CREATE POLICY "Admin Modify: session_batches" ON session_batches FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Player Batches (Phase 2 readiness)
CREATE POLICY "Tenant Isolation: player_batches Select" ON player_batches FOR SELECT
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()));
CREATE POLICY "Admin Modify: player_batches" ON player_batches FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());


-- =======================================================
-- 6. SUPABASE CUSTOM ACCESS TOKEN HOOK
-- =======================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claims jsonb;
    user_status "ApprovalStatus";
    user_permissions jsonb;
    user_academy_id uuid;
BEGIN
    SELECT status INTO user_status FROM users WHERE id = (event->>'user_id')::uuid;
    
    SELECT academy_id, permissions INTO user_academy_id, user_permissions
    FROM user_academy_roles 
    WHERE user_id = (event->>'user_id')::uuid 
    LIMIT 1;

    claims := event->'claims';

    IF user_status IS NOT NULL THEN
        claims := jsonb_set(claims, '{status}', to_jsonb(user_status));
    END IF;
    IF user_academy_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{academy_id}', to_jsonb(user_academy_id));
    END IF;
    IF user_permissions IS NOT NULL THEN
        claims := jsonb_set(claims, '{roles}', user_permissions);
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;