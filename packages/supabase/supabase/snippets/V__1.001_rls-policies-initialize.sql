-- 1. Helper
CREATE OR REPLACE FUNCTION current_academy_id() RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'academy_id')::uuid;
$$ LANGUAGE sql STABLE;

-- 2. Enable
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Tenant Isolation: Academies" ON academies
  USING (id = current_academy_id());

CREATE POLICY "Tenant Isolation: Players" ON players
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

CREATE POLICY "Tenant Isolation: Attendance" ON attendance
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

  -- Lock all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_roles ENABLE ROW LEVEL SECURITY;

-- locations
CREATE POLICY "Tenant Isolation: locations" ON locations
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

-- sports
CREATE POLICY "Tenant Isolation: sports" ON sports
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

-- batches
CREATE POLICY "Tenant Isolation: batches" ON batches
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

-- sessions
CREATE POLICY "Tenant Isolation: sessions" ON sessions
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());

-- user_academy_roles
CREATE POLICY "Tenant Isolation: user_academy_roles" ON user_academy_roles
  USING (academy_id = current_academy_id())
  WITH CHECK (academy_id = current_academy_id());


  -- session_batches
CREATE POLICY "Tenant Isolation: session_batches" ON session_batches
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_batches.session_id 
      AND sessions.academy_id = current_academy_id()
    )
  );

-- player_batches
CREATE POLICY "Tenant Isolation: player_batches" ON player_batches
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = player_batches.player_id 
      AND players.academy_id = current_academy_id()
    )
  );

-- parent_player
CREATE POLICY "Tenant Isolation: parent_player" ON parent_player
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = parent_player.player_id 
      AND players.academy_id = current_academy_id()
    )
  );

-- users
CREATE POLICY "Tenant Isolation: users" ON users
  USING (
    EXISTS (
      SELECT 1 FROM user_academy_roles 
      WHERE user_academy_roles.user_id = users.id 
      AND user_academy_roles.academy_id = current_academy_id()
    )
  );

  -- CREATE POLICY "Tenant Isolation: users" ON users
  -- USING (
  --   id = auth.uid() -- See self
  --   OR
  --   EXISTS (
  --     SELECT 1 FROM user_academy_roles 
  --     WHERE user_academy_roles.user_id = users.id 
  --     AND user_academy_roles.academy_id = current_academy_id()
  --   ) -- See others in same academy
  -- );