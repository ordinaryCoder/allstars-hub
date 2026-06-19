-- Function to insert a new user into the public.users table
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
BEGIN
  -- Find the first active academy
  SELECT id INTO academy_id_to_use FROM public.academies WHERE is_active = TRUE LIMIT 1;

  -- Extract role from metadata, default to 'player'
  user_role := NEW.raw_user_meta_data ->> 'role';
  location_id_to_use := (NEW.raw_user_meta_data ->> 'location_id')::UUID;
  IF user_role IS NULL THEN
    user_role := 'player';
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, first_name, last_name, mobile_number)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name', NEW.raw_user_meta_data ->> 'mobile_number');

  -- Insert into user_academy_roles
  INSERT INTO public.user_academy_roles (user_id, academy_id, permissions)
  VALUES (NEW.id, academy_id_to_use, jsonb_build_array(user_role));

  -- Handle player creation
  IF user_role = 'player' THEN
    INSERT INTO public.players (academy_id, location_id, user_id, first_name, last_name, dob)
    VALUES (academy_id_to_use, location_id_to_use, NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name', (NEW.raw_user_meta_data ->> 'dob')::date);
  ELSIF user_role = 'parent' THEN
    INSERT INTO public.players (academy_id, location_id, first_name, last_name, dob)
    VALUES (academy_id_to_use, location_id_to_use, NEW.raw_user_meta_data ->> 'player_first_name', NEW.raw_user_meta_data ->> 'player_last_name', (NEW.raw_user_meta_data ->> 'dob')::date)
    RETURNING id INTO new_player_id;

    INSERT INTO public.parent_player (parent_user_id, player_id)
    VALUES (NEW.id, new_player_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Create a new trigger that fires on user email confirmation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Create a new trigger that fires on user email confirmation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();