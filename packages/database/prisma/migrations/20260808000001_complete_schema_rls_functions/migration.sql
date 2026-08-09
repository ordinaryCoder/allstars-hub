-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║              ALLSTARS HUB — COMPLETE MIGRATION (SCHEMA + RLS)           ║
-- ║                                                                          ║
-- ║  Includes all tables, enums, indexes, unique constraints, FKs, RLS      ║
-- ║  policies, JWT helpers, auth hooks, triggers, and utility functions.     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- =======================================================
-- SECTION 1 — ENUMS
-- =======================================================

CREATE TYPE "ApprovalStatus"   AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');


-- =======================================================
-- SECTION 2 — TABLES
-- =======================================================

CREATE TABLE "academies" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT        NOT NULL,
    "is_active"  BOOLEAN     NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id"            UUID             NOT NULL,
    "email"         TEXT             NOT NULL,
    "first_name"    TEXT             NOT NULL,
    "last_name"     TEXT             NOT NULL,
    "mobile_number" TEXT,
    "status"        "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at"    TIMESTAMPTZ      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_academy_roles" (
    "id"          UUID  NOT NULL DEFAULT gen_random_uuid(),
    "user_id"     UUID  NOT NULL,
    "academy_id"  UUID  NOT NULL,
    "permissions" JSONB NOT NULL,
    CONSTRAINT "user_academy_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locations" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "name"       TEXT NOT NULL,
    "address"    TEXT,
    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sports" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "name"       TEXT NOT NULL,
    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batches" (
    "id"          UUID    NOT NULL DEFAULT gen_random_uuid(),
    "academy_id"  UUID    NOT NULL,
    "location_id" UUID    NOT NULL,
    "sport_id"    UUID    NOT NULL,
    "name"        TEXT    NOT NULL,
    "age_min"     INTEGER,
    "age_max"     INTEGER,
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "players" (
    "id"          UUID    NOT NULL DEFAULT gen_random_uuid(),
    "academy_id"  UUID    NOT NULL,
    "location_id" UUID    NOT NULL,
    "user_id"     UUID,
    "first_name"  TEXT    NOT NULL,
    "last_name"   TEXT    NOT NULL,
    "dob"         DATE    NOT NULL,
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "academy_id"  UUID        NOT NULL,
    "location_id" UUID        NOT NULL,
    "created_by"  UUID        NOT NULL,
    "start_time"  TIMESTAMPTZ NOT NULL,
    "end_time"    TIMESTAMPTZ NOT NULL,
    "coach_id"    UUID,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_batches" (
    "session_id" UUID NOT NULL,
    "batch_id"   UUID NOT NULL,
    CONSTRAINT "session_batches_pkey" PRIMARY KEY ("session_id", "batch_id")
);

CREATE TABLE "player_batches" (
    "player_id" UUID NOT NULL,
    "batch_id"  UUID NOT NULL,
    CONSTRAINT "player_batches_pkey" PRIMARY KEY ("player_id", "batch_id")
);

CREATE TABLE "attendance" (
    "id"         UUID               NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID               NOT NULL,
    "session_id" UUID               NOT NULL,
    "player_id"  UUID               NOT NULL,
    "marked_by"  UUID               NOT NULL,
    "status"     "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "marked_at"  TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_player" (
    "parent_user_id" UUID NOT NULL,
    "player_id"      UUID NOT NULL,
    CONSTRAINT "parent_player_pkey" PRIMARY KEY ("parent_user_id", "player_id")
);

CREATE TABLE "goals" (
    "id"           UUID    NOT NULL DEFAULT gen_random_uuid(),
    "session_id"   UUID    NOT NULL,
    "title"        TEXT    NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coach_locations" (
    "user_id"     UUID NOT NULL,
    "location_id" UUID NOT NULL,
    CONSTRAINT "coach_locations_pkey" PRIMARY KEY ("user_id", "location_id")
);


-- =======================================================
-- SECTION 3 — UNIQUE CONSTRAINTS
-- =======================================================

CREATE UNIQUE INDEX "users_email_key"
    ON "users"("email");

CREATE UNIQUE INDEX "user_academy_roles_user_id_academy_id_key"
    ON "user_academy_roles"("user_id", "academy_id");

CREATE UNIQUE INDEX "attendance_session_id_player_id_key"
    ON "attendance"("session_id", "player_id");


-- =======================================================
-- SECTION 4 — PERFORMANCE INDEXES
-- =======================================================

CREATE INDEX "sessions_academy_id_start_time_idx" ON "sessions"("academy_id", "start_time" DESC);
CREATE INDEX "sessions_coach_id_idx"               ON "sessions"("coach_id");
CREATE INDEX "sessions_location_id_idx"            ON "sessions"("location_id");
CREATE INDEX "sessions_created_by_idx"             ON "sessions"("created_by");

CREATE INDEX "attendance_session_id_idx"           ON "attendance"("session_id");
CREATE INDEX "attendance_player_id_idx"            ON "attendance"("player_id");
CREATE INDEX "attendance_academy_id_idx"           ON "attendance"("academy_id");
CREATE INDEX "attendance_session_id_status_idx"    ON "attendance"("session_id", "status");

CREATE INDEX "players_location_id_is_active_idx"   ON "players"("location_id", "is_active");
CREATE INDEX "players_academy_id_idx"              ON "players"("academy_id");
CREATE INDEX "players_user_id_idx"                 ON "players"("user_id");

CREATE INDEX "user_academy_roles_user_id_idx"      ON "user_academy_roles"("user_id");
CREATE INDEX "user_academy_roles_academy_id_idx"   ON "user_academy_roles"("academy_id");

CREATE INDEX "parent_player_parent_user_id_idx"    ON "parent_player"("parent_user_id");
CREATE INDEX "parent_player_player_id_idx"         ON "parent_player"("player_id");

CREATE INDEX "goals_session_id_idx"                ON "goals"("session_id");


-- =======================================================
-- SECTION 5 — FOREIGN KEYS
-- =======================================================

ALTER TABLE "user_academy_roles"
    ADD CONSTRAINT "user_academy_roles_user_id_fkey"    FOREIGN KEY ("user_id")    REFERENCES "users"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "user_academy_roles_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "locations"
    ADD CONSTRAINT "locations_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sports"
    ADD CONSTRAINT "sports_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "batches"
    ADD CONSTRAINT "batches_academy_id_fkey"  FOREIGN KEY ("academy_id")  REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "batches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "batches_sport_id_fkey"    FOREIGN KEY ("sport_id")    REFERENCES "sports"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "players"
    ADD CONSTRAINT "players_academy_id_fkey"  FOREIGN KEY ("academy_id")  REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "players_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_academy_id_fkey"  FOREIGN KEY ("academy_id")  REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "sessions_created_by_fkey"  FOREIGN KEY ("created_by")  REFERENCES "users"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "sessions_coach_id_fkey"    FOREIGN KEY ("coach_id")    REFERENCES "users"("id")     ON DELETE SET NULL  ON UPDATE CASCADE;

ALTER TABLE "session_batches"
    ADD CONSTRAINT "session_batches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "session_batches_batch_id_fkey"   FOREIGN KEY ("batch_id")   REFERENCES "batches"("id")  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "player_batches"
    ADD CONSTRAINT "player_batches_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "player_batches_batch_id_fkey"  FOREIGN KEY ("batch_id")  REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance"
    ADD CONSTRAINT "attendance_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "attendance_player_id_fkey"  FOREIGN KEY ("player_id")  REFERENCES "players"("id")   ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "attendance_marked_by_fkey"  FOREIGN KEY ("marked_by")  REFERENCES "users"("id")     ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "parent_player"
    ADD CONSTRAINT "parent_player_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id")   ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "parent_player_player_id_fkey"      FOREIGN KEY ("player_id")      REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "goals"
    ADD CONSTRAINT "goals_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "coach_locations"
    ADD CONSTRAINT "coach_locations_user_id_fkey"     FOREIGN KEY ("user_id")     REFERENCES "users"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "coach_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- =======================================================
-- SECTION 6 — ENABLE ROW LEVEL SECURITY
-- =======================================================

ALTER TABLE academies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_batches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals              ENABLE ROW LEVEL SECURITY;


-- =======================================================
-- SECTION 7 — JWT HELPER FUNCTIONS
-- =======================================================

CREATE OR REPLACE FUNCTION get_jwt_claims()
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb;
$$;

CREATE OR REPLACE FUNCTION current_academy_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(get_jwt_claims() ->> 'academy_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(get_jwt_claims() ->> 'sub', '00000000-0000-0000-0000-000000000000')::uuid;
$$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE((get_jwt_claims() -> 'roles') ? 'admin', false);
$$;


-- =======================================================
-- SECTION 8 — RLS POLICIES
-- =======================================================

-- Academies
CREATE POLICY "Tenant Isolation: Academies" ON academies
  USING (id = current_academy_id());

-- Sports
CREATE POLICY "Tenant Isolation: sports Select" ON sports
  FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: sports" ON sports
  FOR ALL USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Locations
CREATE POLICY "Tenant Isolation: locations Select" ON locations
  FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: locations" ON locations
  FOR ALL USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Batches
CREATE POLICY "Tenant Isolation: batches Select" ON batches
  FOR SELECT USING (academy_id = current_academy_id());
CREATE POLICY "Admin Modify: batches" ON batches
  FOR ALL USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Players
CREATE POLICY "Tenant Isolation: Players Select" ON players
  FOR SELECT USING (
    academy_id = current_academy_id() AND (
      is_admin()
      OR user_id = current_user_id()
      OR location_id = ANY(
        SELECT location_id FROM coach_locations WHERE user_id = current_user_id()
        UNION
        SELECT location_id FROM sessions
          WHERE coach_id = current_user_id()
            AND end_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      )
      OR EXISTS (
        SELECT 1 FROM parent_player pp
        WHERE pp.player_id = players.id AND pp.parent_user_id = current_user_id()
      )
    )
  );
CREATE POLICY "Admin Modify: Players" ON players
  FOR ALL USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Sessions
CREATE POLICY "Tenant Isolation: Sessions Select" ON sessions
  FOR SELECT USING (
    academy_id = current_academy_id() AND (
      is_admin()
      OR created_by = current_user_id()
      OR coach_id = current_user_id()
      OR location_id IN (SELECT location_id FROM coach_locations WHERE user_id = current_user_id())
    )
  );
CREATE POLICY "Sessions Insert" ON sessions
  FOR INSERT WITH CHECK (
    academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id())
  );
CREATE POLICY "Sessions Update" ON sessions
  FOR UPDATE USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());
CREATE POLICY "Sessions Delete" ON sessions
  FOR DELETE USING (academy_id = current_academy_id() AND is_admin());

-- Attendance
CREATE POLICY "Tenant Isolation: Attendance Select" ON attendance
  FOR SELECT USING (
    academy_id = current_academy_id() AND (
      is_admin()
      OR marked_by = current_user_id()
      OR EXISTS (
        SELECT 1 FROM sessions s
        LEFT JOIN coach_locations cl
          ON cl.location_id = s.location_id AND cl.user_id = current_user_id()
        WHERE s.id = attendance.session_id
          AND (s.coach_id = current_user_id() OR cl.location_id IS NOT NULL)
      )
      OR EXISTS (
        SELECT 1 FROM parent_player pp
        WHERE pp.player_id = attendance.player_id AND pp.parent_user_id = current_user_id()
      )
      OR player_id IN (SELECT id FROM players WHERE user_id = current_user_id())
    )
  );
CREATE POLICY "Attendance Insert" ON attendance
  FOR INSERT WITH CHECK (
    academy_id = current_academy_id() AND (is_admin() OR marked_by = current_user_id())
  );
CREATE POLICY "Attendance Update" ON attendance
  FOR UPDATE USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());
CREATE POLICY "Attendance Delete" ON attendance
  FOR DELETE USING (academy_id = current_academy_id() AND is_admin());

-- Goals
CREATE POLICY "Tenant Isolation: goals Select" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = goals.session_id AND sessions.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Modify: goals" ON goals
  FOR ALL
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = goals.session_id
      AND (sessions.created_by = current_user_id() OR sessions.coach_id = current_user_id())
  ))
  WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = goals.session_id
      AND (sessions.created_by = current_user_id() OR sessions.coach_id = current_user_id())
  ));

-- Users
CREATE POLICY "Tenant Isolation: users Select" ON users
  FOR SELECT USING (
    id = current_user_id()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM user_academy_roles
      WHERE user_academy_roles.user_id = users.id
        AND user_academy_roles.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Modify: users" ON users
  FOR ALL USING (id = current_user_id() OR is_admin())
  WITH CHECK (id = current_user_id() OR is_admin());

-- User Academy Roles
CREATE POLICY "Tenant Isolation: user_academy_roles Select" ON user_academy_roles
  FOR SELECT USING (academy_id = current_academy_id() OR user_id = current_user_id());
CREATE POLICY "Admin Modify: user_academy_roles" ON user_academy_roles
  FOR ALL USING (academy_id = current_academy_id() AND is_admin())
  WITH CHECK (academy_id = current_academy_id() AND is_admin());

-- Coach Locations
CREATE POLICY "Tenant Isolation: coach_locations Select" ON coach_locations
  FOR SELECT USING (is_admin() OR user_id = current_user_id());
CREATE POLICY "Admin Modify: coach_locations" ON coach_locations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Parent Player
CREATE POLICY "Tenant Isolation: parent_player Select" ON parent_player
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = parent_player.player_id AND players.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Admin Modify: parent_player" ON parent_player
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Session Batches
CREATE POLICY "Tenant Isolation: session_batches Select" ON session_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_batches.session_id AND s.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Admin Modify: session_batches" ON session_batches
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Player Batches
CREATE POLICY "Tenant Isolation: player_batches Select" ON player_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()
    )
  );
CREATE POLICY "Admin Modify: player_batches" ON player_batches
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- =======================================================
-- SECTION 9 — CUSTOM ACCESS TOKEN HOOK
-- =======================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_claims     jsonb;
    v_status     "ApprovalStatus";
    v_academy_id uuid;
    v_perms      jsonb;
BEGIN
    SELECT u.status, uar.academy_id, uar.permissions
    INTO   v_status, v_academy_id,   v_perms
    FROM   users u
    LEFT JOIN user_academy_roles uar ON uar.user_id = u.id
    WHERE  u.id = (event->>'user_id')::uuid
    LIMIT  1;

    v_claims := event->'claims';

    IF v_status     IS NOT NULL THEN v_claims := jsonb_set(v_claims, '{status}',     to_jsonb(v_status));     END IF;
    IF v_academy_id IS NOT NULL THEN v_claims := jsonb_set(v_claims, '{academy_id}', to_jsonb(v_academy_id)); END IF;
    IF v_perms      IS NOT NULL THEN v_claims := jsonb_set(v_claims, '{roles}',      v_perms);                END IF;

    RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE ALL     ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT USAGE    ON SCHEMA public TO supabase_auth_admin;


-- =======================================================
-- SECTION 10 — NEW USER TRIGGER (fires on email confirm)
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id  UUID;
  v_location_id UUID;
  v_player_id   UUID;
  v_role        TEXT;
  v_first_name  TEXT;
  v_last_name   TEXT;
  v_dob         DATE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_academy_id
  FROM public.academies WHERE is_active = TRUE
  ORDER BY created_at ASC LIMIT 1;

  IF v_academy_id IS NULL THEN
    RAISE WARNING 'handle_new_user(): no active academy found for user %', NEW.id;
    RETURN NEW;
  END IF;

  v_role        := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'),        ''), 'player');
  v_location_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'location_id'),           '')::UUID;
  v_dob         := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'dob'),                   '')::DATE;

  IF v_role = 'parent' THEN
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'guardian_name'), ''), 'Unknown');
    v_last_name  := '';
  ELSE
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'),    ''), 'Unknown');
    v_last_name  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),     ''), '');
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, mobile_number)
  VALUES (NEW.id, NEW.email, v_first_name, v_last_name,
          NULLIF(TRIM(NEW.raw_user_meta_data ->> 'mobile_number'), ''));

  INSERT INTO public.user_academy_roles (user_id, academy_id, permissions)
  VALUES (NEW.id, v_academy_id, jsonb_build_array(v_role));

  IF v_role = 'player' THEN
    INSERT INTO public.players (academy_id, location_id, user_id, first_name, last_name, dob)
    VALUES (v_academy_id, v_location_id, NEW.id,
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), v_first_name),
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),  ''), v_last_name),
            v_dob);

  ELSIF v_role = 'parent' THEN
    INSERT INTO public.players (academy_id, location_id, first_name, last_name, dob)
    VALUES (v_academy_id, v_location_id,
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown'),
            COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),  ''), ''),
            v_dob)
    RETURNING id INTO v_player_id;

    INSERT INTO public.parent_player (parent_user_id, player_id)
    VALUES (NEW.id, v_player_id);
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user() error for user % (role: %): % [%]',
    NEW.id, v_role, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created   ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed  ON auth.users;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();


-- =======================================================
-- SECTION 11 — PERMANENT USER DELETION UTILITY
-- =======================================================

CREATE OR REPLACE FUNCTION public.delete_user_permanently(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id    UUID;
    v_player_ids UUID[];
BEGIN
    SELECT id INTO v_user_id FROM auth.users   WHERE email = target_email;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.users WHERE email = target_email;
    END IF;
    IF v_user_id IS NULL THEN
        RETURN 'User with email ' || target_email || ' not found.';
    END IF;

    SELECT ARRAY_AGG(id) INTO v_player_ids FROM (
        SELECT id       FROM public.players       WHERE user_id        = v_user_id
        UNION
        SELECT player_id FROM public.parent_player WHERE parent_user_id = v_user_id
    ) t;

    DELETE FROM public.attendance
    WHERE (v_player_ids IS NOT NULL AND player_id = ANY(v_player_ids)) OR marked_by = v_user_id;

    IF v_player_ids IS NOT NULL THEN
        DELETE FROM public.player_batches WHERE player_id = ANY(v_player_ids);
    END IF;

    DELETE FROM public.parent_player
    WHERE parent_user_id = v_user_id
       OR (v_player_ids IS NOT NULL AND player_id = ANY(v_player_ids));

    IF v_player_ids IS NOT NULL THEN
        DELETE FROM public.players WHERE id = ANY(v_player_ids);
    END IF;
    DELETE FROM public.players WHERE user_id = v_user_id;

    UPDATE public.sessions SET coach_id = NULL WHERE coach_id = v_user_id;
    DELETE FROM public.goals
        WHERE session_id IN (SELECT id FROM public.sessions WHERE created_by = v_user_id);
    DELETE FROM public.session_batches
        WHERE session_id IN (SELECT id FROM public.sessions WHERE created_by = v_user_id);
    DELETE FROM public.sessions WHERE created_by = v_user_id;

    DELETE FROM public.coach_locations    WHERE user_id = v_user_id;
    DELETE FROM public.user_academy_roles WHERE user_id = v_user_id;
    DELETE FROM public.users              WHERE id      = v_user_id;
    DELETE FROM auth.users                WHERE id      = v_user_id;

    RETURN 'Successfully deleted user ' || target_email || ' (ID: ' || v_user_id || ') and all linked records.';
END;
$$;
