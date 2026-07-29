-- =======================================================
--  ADD USER ON EMAIL CONFIRMATION TRIGGER
-- =======================================================

-- Function to insert a new user into the public tables after email verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  academy_id_to_use UUID;
  user_role TEXT;
  location_id_to_use UUID;
  new_player_id UUID;
  u_first_name TEXT;
  u_last_name TEXT;
BEGIN
  -- 1. Find the first active academy to associate with the new user
  SELECT id INTO academy_id_to_use FROM public.academies WHERE is_active = TRUE LIMIT 1;

  -- 2. Extract the role and location from the Supabase auth metadata
  user_role := NEW.raw_user_meta_data ->> 'role';
  location_id_to_use := (NEW.raw_user_meta_data ->> 'location_id')::UUID;
  
  -- Fallback in case role is missing from the frontend request
  IF user_role IS NULL THEN
    user_role := 'player';
  END IF;

  -- 3. Determine the User's first and last name based on their role
  IF user_role = 'parent' THEN
    -- Parents only provide 'guardian_name' in the metadata. 
    -- Because last_name is required in the Prisma schema, we must pass an empty string.
    u_first_name := NEW.raw_user_meta_data ->> 'guardian_name';
    u_last_name := ''; 
  ELSE
    -- Players provide standard first and last names
    u_first_name := NEW.raw_user_meta_data ->> 'first_name';
    u_last_name := NEW.raw_user_meta_data ->> 'last_name';
  END IF;

  -- 4. Insert into the public.users table
  -- Note: The 'status' column will automatically default to 'PENDING' per your schema
  INSERT INTO public.users (id, email, first_name, last_name, mobile_number)
  VALUES (
    NEW.id, 
    NEW.email, 
    u_first_name, 
    u_last_name, 
    NEW.raw_user_meta_data ->> 'mobile_number'
  );

  -- 5. Insert into user_academy_roles to establish permissions
  INSERT INTO public.user_academy_roles (user_id, academy_id, permissions)
  VALUES (NEW.id, academy_id_to_use, jsonb_build_array(user_role));

  -- 6. Handle Player table creation based on role
  IF user_role = 'player' THEN
    -- If the user is a player, link their new user.id directly to the players table
    INSERT INTO public.players (academy_id, location_id, user_id, first_name, last_name, dob)
    VALUES (
      academy_id_to_use, 
      location_id_to_use, 
      NEW.id, 
      NEW.raw_user_meta_data ->> 'first_name', 
      NEW.raw_user_meta_data ->> 'last_name', 
      (NEW.raw_user_meta_data ->> 'dob')::date
    );
    
  ELSIF user_role = 'parent' THEN
    -- If the user is a parent, create the child in the players table (leaving user_id null)
    INSERT INTO public.players (academy_id, location_id, first_name, last_name, dob)
    VALUES (
      academy_id_to_use, 
      location_id_to_use, 
      NEW.raw_user_meta_data ->> 'first_name', 
      NEW.raw_user_meta_data ->> 'last_name', 
      (NEW.raw_user_meta_data ->> 'dob')::date
    )
    RETURNING id INTO new_player_id; -- Capture the generated UUID for the child

    -- Link the parent user to the newly created child player
    INSERT INTO public.parent_player (parent_user_id, player_id)
    VALUES (NEW.id, new_player_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the old trigger to prevent duplicates or conflicts
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create the trigger to fire ONLY when confirmed_at transitions from NULL to a timestamp
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
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

