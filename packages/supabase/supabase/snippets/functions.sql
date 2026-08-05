-- =======================================================
--  ADD USER ON EMAIL CONFIRMATION TRIGGER
-- =======================================================

-- Function to insert a new user into the public tables after email verification.
-- Fires AFTER UPDATE OF email_confirmed_at ON auth.users,
-- only when email_confirmed_at transitions from NULL → non-NULL (i.e. the user
-- clicked their confirmation link).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id   UUID;
  v_location_id  UUID;
  v_player_id    UUID;
  v_role         TEXT;
  v_first_name   TEXT;
  v_last_name    TEXT;
  v_dob          DATE;
BEGIN
  -- ── 0. IDEMPOTENCY GUARD ───────────────────────────────────────────────────
  -- If the user row already exists in public.users (e.g. trigger fired twice,
  -- or admin created the user manually), do nothing and return safely.
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- ── 1. RESOLVE ACADEMY ────────────────────────────────────────────────────
  SELECT id INTO v_academy_id
  FROM public.academies
  WHERE is_active = TRUE
  LIMIT 1;

  -- If no active academy exists we cannot proceed; log and bail safely.
  IF v_academy_id IS NULL THEN
    RAISE WARNING 'handle_new_user(): no active academy found for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- ── 2. EXTRACT & NORMALISE METADATA ───────────────────────────────────────
  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'), ''), 'player');

  -- Safe UUID cast: empty string → NULL (avoids "invalid input syntax for type uuid")
  v_location_id := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'location_id'), '')::UUID;

  -- Safe DATE cast: empty string → NULL (avoids "invalid input syntax for type date")
  v_dob := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'dob'), '')::DATE;

  -- ── 3. RESOLVE NAMES PER ROLE ─────────────────────────────────────────────
  IF v_role = 'parent' THEN
    -- For parents: public.users stores the guardian's name.
    -- first_name / last_name in metadata are the CHILD's names (used for the player row).
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'guardian_name'), ''), 'Unknown');
    v_last_name  := '';
  ELSE
    -- player / coach / admin: standard first + last name
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown');
    v_last_name  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),  ''), '');
  END IF;

  -- ── 4. INSERT INTO public.users ───────────────────────────────────────────
  INSERT INTO public.users (id, email, first_name, last_name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'mobile_number'), '')
  );

  -- ── 5. INSERT INTO public.user_academy_roles ──────────────────────────────
  INSERT INTO public.user_academy_roles (user_id, academy_id, permissions)
  VALUES (NEW.id, v_academy_id, jsonb_build_array(v_role));

  -- ── 6. ROLE-SPECIFIC RECORDS ──────────────────────────────────────────────
  IF v_role = 'player' THEN
    -- Player self-registers: create their player profile linked to their user account.
    INSERT INTO public.players (academy_id, location_id, user_id, first_name, last_name, dob)
    VALUES (
      v_academy_id,
      v_location_id,
      NEW.id,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), v_first_name),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),  ''), v_last_name),
      v_dob
    );

  ELSIF v_role = 'parent' THEN
    -- Parent registers: create the CHILD's player profile (user_id left NULL).
    -- first_name / last_name in metadata are the child's names.
    INSERT INTO public.players (academy_id, location_id, first_name, last_name, dob)
    VALUES (
      v_academy_id,
      v_location_id,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown'),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'),  ''), ''),
      v_dob
    )
    RETURNING id INTO v_player_id;

    -- Link the parent user to the child player.
    INSERT INTO public.parent_player (parent_user_id, player_id)
    VALUES (NEW.id, v_player_id);

  -- coach / admin: no player record needed; user_academy_roles entry is sufficient.
  END IF;

  RETURN NEW;

-- ── EXCEPTION HANDLER ───────────────────────────────────────────────────────
-- CRITICAL: never re-raise here.
-- An unhandled exception propagates into GoTrue's open transaction, causing it
-- to roll back the email_confirmed_at update and then use a fallback path that
-- skips confirmation_token entirely and auto-confirms the user — corrupting the
-- entire confirmation flow.
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user() error for user % (role: %): % [%]',
    NEW.id, v_role, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- ── TRIGGER SETUP ─────────────────────────────────────────────────────────────
-- Drop legacy triggers (belt-and-suspenders — covers any old AFTER INSERT variants).
DROP TRIGGER IF EXISTS on_auth_user_created  ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Fire ONLY when email_confirmed_at transitions NULL → non-NULL.
-- GoTrue writes to email_confirmed_at (not confirmed_at, which is a generated column).
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();


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


-- =======================================================
--  DELETE USER OR PLAYER PERMANENTLY FUNCTION
-- =======================================================

-- Function to permanently remove a player or parent along with all associated 
-- data (attendance, batches, parent_player links, roles, public user, and auth user)
-- while maintaining strict foreign key dependency order.
CREATE OR REPLACE FUNCTION public.delete_user_permanently(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_player_ids UUID[];
BEGIN
    -- 1. Locate User ID from auth.users or public.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.users WHERE email = target_email;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN 'User with email ' || target_email || ' not found.';
    END IF;

    -- 2. Identify all associated Player IDs (Self-Registered Player OR Parent's Linked Children)
    SELECT ARRAY_AGG(id) INTO v_player_ids FROM (
        SELECT id FROM public.players WHERE user_id = v_user_id
        UNION
        SELECT player_id FROM public.parent_player WHERE parent_user_id = v_user_id
    ) t;

    -- 3. Delete Attendance records (for these players OR marked by this user)
    DELETE FROM public.attendance 
    WHERE (v_player_ids IS NOT NULL AND player_id = ANY(v_player_ids))
       OR marked_by = v_user_id;

    -- 4. Delete Player Batch associations
    IF v_player_ids IS NOT NULL THEN
        DELETE FROM public.player_batches WHERE player_id = ANY(v_player_ids);
    END IF;

    -- 5. Delete Parent-Player links
    DELETE FROM public.parent_player 
    WHERE parent_user_id = v_user_id 
       OR (v_player_ids IS NOT NULL AND player_id = ANY(v_player_ids));

    -- 6. Delete Player profiles
    IF v_player_ids IS NOT NULL THEN
        DELETE FROM public.players WHERE id = ANY(v_player_ids);
    END IF;
    DELETE FROM public.players WHERE user_id = v_user_id;

    -- 7. Clean up Sessions created or coached by the user
    UPDATE public.sessions SET coach_id = NULL WHERE coach_id = v_user_id;
    DELETE FROM public.goals WHERE session_id IN (SELECT id FROM public.sessions WHERE created_by = v_user_id);
    DELETE FROM public.session_batches WHERE session_id IN (SELECT id FROM public.sessions WHERE created_by = v_user_id);
    DELETE FROM public.sessions WHERE created_by = v_user_id;

    -- 8. Delete Coach Location assignments and User Roles
    DELETE FROM public.coach_locations WHERE user_id = v_user_id;
    DELETE FROM public.user_academy_roles WHERE user_id = v_user_id;

    -- 9. Delete from public.users
    DELETE FROM public.users WHERE id = v_user_id;

    -- 10. Delete from auth.users (Supabase Auth)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN 'Successfully deleted user ' || target_email || ' (ID: ' || v_user_id || ') and all linked records.';
END;
$$;

