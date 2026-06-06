-- This is an empty migration.-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "academies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "mobile_number" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_academy_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "academy_id" UUID NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "user_academy_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "sport_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "user_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_batches" (
    "session_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,

    CONSTRAINT "session_batches_pkey" PRIMARY KEY ("session_id","batch_id")
);

-- CreateTable
CREATE TABLE "player_batches" (
    "player_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,

    CONSTRAINT "player_batches_pkey" PRIMARY KEY ("player_id","batch_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academy_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "marked_by" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "marked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_player" (
    "parent_user_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,

    CONSTRAINT "parent_player_pkey" PRIMARY KEY ("parent_user_id","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "user_academy_roles" ADD CONSTRAINT "user_academy_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_academy_roles" ADD CONSTRAINT "user_academy_roles_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sports" ADD CONSTRAINT "sports_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_batches" ADD CONSTRAINT "session_batches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_batches" ADD CONSTRAINT "session_batches_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_batches" ADD CONSTRAINT "player_batches_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_batches" ADD CONSTRAINT "player_batches_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_player" ADD CONSTRAINT "parent_player_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_player" ADD CONSTRAINT "parent_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =======================================================
-- CUSTOM MULTI-TENANT RLS POLICIES & FUNCTIONS
-- =======================================================

-- 1. Academy ID Extractor Function
CREATE OR REPLACE FUNCTION current_academy_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'academy_id', '')::uuid;
$$ LANGUAGE sql STABLE;

-- Add Current User ID Extractor
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '00000000-0000-0000-0000-000000000000')::uuid;
$$ LANGUAGE sql STABLE;

-- Add Admin Check Extractor
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'roles') ? 'admin', false);
$$ LANGUAGE sql STABLE;

-- 2. Enable Row Level Security on All Tables
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academy_roles ENABLE ROW LEVEL SECURITY;

-- 3. Flat Structural Tables Isolation Policies
CREATE POLICY "Tenant Isolation: Academies" ON academies 
  USING (id = current_academy_id());

CREATE POLICY "Tenant Isolation: Players Select" ON players FOR SELECT 
  USING (academy_id = current_academy_id() AND (is_admin() OR user_id = current_user_id() OR EXISTS (SELECT 1 FROM parent_player pp WHERE pp.player_id = players.id AND pp.parent_user_id = current_user_id()) OR EXISTS (SELECT 1 FROM player_batches pb JOIN session_batches sb ON pb.batch_id = sb.batch_id JOIN sessions s ON sb.session_id = s.id WHERE pb.player_id = players.id AND s.created_by = current_user_id())));

CREATE POLICY "Tenant Isolation: Players Insert" ON players FOR INSERT WITH CHECK (academy_id = current_academy_id() AND is_admin());
CREATE POLICY "Tenant Isolation: Players Update" ON players FOR UPDATE USING (academy_id = current_academy_id() AND is_admin());
CREATE POLICY "Tenant Isolation: Players Delete" ON players FOR DELETE USING (academy_id = current_academy_id() AND is_admin());

CREATE POLICY "Tenant Isolation: Attendance Select" ON attendance FOR SELECT 
  USING (academy_id = current_academy_id());

CREATE POLICY "Tenant Isolation: Attendance Insert" ON attendance FOR INSERT 
  WITH CHECK (academy_id = current_academy_id() AND (is_admin() OR marked_by = current_user_id()));

CREATE POLICY "Tenant Isolation: Attendance Update" ON attendance FOR UPDATE 
  USING (academy_id = current_academy_id() AND (is_admin() OR marked_by = current_user_id()));

CREATE POLICY "Tenant Isolation: Attendance Delete" ON attendance FOR DELETE 
  USING (academy_id = current_academy_id() AND (is_admin() OR marked_by = current_user_id()));

CREATE POLICY "Tenant Isolation: sports" ON sports 
  USING (academy_id = current_academy_id()) 
  WITH CHECK (academy_id = current_academy_id());

CREATE POLICY "Tenant Isolation: Sessions Insert" ON sessions FOR INSERT 
  WITH CHECK (academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id()));

CREATE POLICY "Tenant Isolation: Sessions Update" ON sessions FOR UPDATE 
  USING (academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id()));

CREATE POLICY "Tenant Isolation: Sessions Delete" ON sessions FOR DELETE 
  USING (academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id()));

-- 4. Dynamic Mapping & Relationship Tables Isolation Policies
CREATE POLICY "Tenant Isolation: user_academy_roles" ON user_academy_roles
  USING (academy_id = current_academy_id() OR user_id = (SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '00000000-0000-0000-0000-000000000000'))::uuid)
  WITH CHECK (academy_id = current_academy_id());

CREATE POLICY "Tenant Isolation: session_batches" ON session_batches
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_batches.session_id AND sessions.academy_id = current_academy_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_batches.session_id AND sessions.academy_id = current_academy_id()));

CREATE POLICY "Tenant Isolation: player_batches Select" ON player_batches FOR SELECT
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()));

CREATE POLICY "Tenant Isolation: player_batches Insert" ON player_batches FOR INSERT
  WITH CHECK (is_admin() AND EXISTS (SELECT 1 FROM players WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()));

CREATE POLICY "Tenant Isolation: player_batches Update" ON player_batches FOR UPDATE
  USING (is_admin() AND EXISTS (SELECT 1 FROM players WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()));

CREATE POLICY "Tenant Isolation: player_batches Delete" ON player_batches FOR DELETE
  USING (is_admin() AND EXISTS (SELECT 1 FROM players WHERE players.id = player_batches.player_id AND players.academy_id = current_academy_id()));

CREATE POLICY "Tenant Isolation: parent_player" ON parent_player
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = parent_player.player_id AND players.academy_id = current_academy_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE players.id = parent_player.player_id AND players.academy_id = current_academy_id()));

-- 5. User Profile Isolation (Bypasses shadow db compile checks safely)
CREATE POLICY "Tenant Isolation: users" ON users
  USING (
    id = (SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '00000000-0000-0000-0000-000000000000'))::uuid
    OR 
    EXISTS (
      SELECT 1 FROM user_academy_roles 
      WHERE user_academy_roles.user_id = users.id 
      AND user_academy_roles.academy_id = current_academy_id()
    )
  )
  WITH CHECK (id = (SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '00000000-0000-0000-0000-000000000000'))::uuid);

-- =======================================================
-- SUPABASE CUSTOM ACCESS TOKEN HOOK
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
    -- Fetch user status and role data
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


-- ENABLE NEW TABLES RLS --
ALTER TABLE coach_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ADMIN ONLY FOR ASSIGNMENTS --
CREATE POLICY "Tenant Isolation: coach_batches" ON coach_batches
  USING (is_admin() OR user_id = current_user_id())
  WITH CHECK (is_admin());

-- ISOLATE LOCATIONS (Coach sees only assigned) --
DROP POLICY IF EXISTS "Tenant Isolation: locations" ON locations;
CREATE POLICY "Tenant Isolation: locations Select" ON locations FOR SELECT 
  USING (academy_id = current_academy_id() AND (is_admin() OR EXISTS (SELECT 1 FROM coach_batches cb JOIN batches b ON cb.batch_id = b.id WHERE cb.user_id = current_user_id() AND b.location_id = locations.id)));

-- ISOLATE BATCHES (Coach sees only assigned) --
DROP POLICY IF EXISTS "Tenant Isolation: batches" ON batches;
CREATE POLICY "Tenant Isolation: batches Select" ON batches FOR SELECT 
  USING (academy_id = current_academy_id() AND (is_admin() OR EXISTS (SELECT 1 FROM coach_batches cb WHERE cb.user_id = current_user_id() AND cb.batch_id = batches.id)));

-- ISOLATE SESSIONS (Coach sees created, assigned, or batch-linked) --
DROP POLICY IF EXISTS "Tenant Isolation: Sessions Select" ON sessions;
CREATE POLICY "Tenant Isolation: Sessions Select" ON sessions FOR SELECT 
  USING (academy_id = current_academy_id() AND (is_admin() OR created_by = current_user_id() OR coach_id = current_user_id() OR EXISTS (SELECT 1 FROM session_batches sb JOIN coach_batches cb ON sb.batch_id = cb.batch_id WHERE sb.session_id = sessions.id AND cb.user_id = current_user_id())));

-- RESTRICT SESSION BATCH CREATION (Coach only links assigned batches) --
DROP POLICY IF EXISTS "Tenant Isolation: session_batches" ON session_batches;
CREATE POLICY "Tenant Isolation: session_batches Insert" ON session_batches FOR INSERT 
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.created_by = current_user_id() AND EXISTS (SELECT 1 FROM coach_batches cb WHERE cb.batch_id = session_batches.batch_id AND cb.user_id = current_user_id())));

-- READ session_batches (Coach sees batches linked to visible sessions)
CREATE POLICY "Tenant Isolation: session_batches Select" ON session_batches FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_batches.session_id AND s.academy_id = current_academy_id()));

-- GOALS RLS --
CREATE POLICY "Tenant Isolation: goals Select" ON goals FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = goals.session_id AND sessions.academy_id = current_academy_id()));
CREATE POLICY "Tenant Isolation: goals Modify" ON goals FOR ALL 
  USING (is_admin() OR EXISTS (SELECT 1 FROM sessions WHERE sessions.id = goals.session_id AND (sessions.created_by = current_user_id() OR sessions.coach_id = current_user_id())));