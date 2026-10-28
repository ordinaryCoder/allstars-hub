-- AlterTable
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(15);

-- Backfill mobile_number for any existing players
UPDATE public.players p
SET mobile_number = COALESCE(
  (SELECT u.mobile_number FROM public.users u WHERE u.id = p.user_id AND u.mobile_number IS NOT NULL AND u.mobile_number != ''),
  (SELECT u.mobile_number FROM public.parent_player pp JOIN public.users u ON pp.parent_user_id = u.id WHERE pp.player_id = p.id AND u.mobile_number IS NOT NULL AND u.mobile_number != '' LIMIT 1),
  '9999999999'
)
WHERE p.mobile_number IS NULL OR p.mobile_number = '';

-- AlterTable constraints
ALTER TABLE public.players ALTER COLUMN mobile_number SET NOT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- CreateIndex
DROP INDEX IF EXISTS public.players_mobile_number_idx;
CREATE INDEX IF NOT EXISTS idx_players_academy_mobile ON public.players (academy_id, mobile_number);

-- Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id  UUID;
  v_role        TEXT;
  v_first_name  TEXT;
  v_last_name   TEXT;
  v_mobile      TEXT;
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

  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'), ''), 'player');

  -- Extract clean 10-digit mobile number
  v_mobile := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'mobile_number'), ''),
    NULLIF(TRIM(NEW.phone), '')
  );
  IF v_mobile LIKE '+91%' THEN
    v_mobile := SUBSTRING(v_mobile FROM 4);
  END IF;
  v_mobile := REGEXP_REPLACE(COALESCE(v_mobile, ''), '\D', '', 'g');
  IF LENGTH(v_mobile) != 10 THEN
    v_mobile := NULL;
  END IF;

  IF v_role = 'parent' THEN
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'guardian_name'), ''), 'Parent');
    v_last_name  := '';
  ELSE
    v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Player');
    v_last_name  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), ''), '');
  END IF;

  -- Insert user record with status PENDING
  INSERT INTO public.users (id, email, first_name, last_name, mobile_number, status)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.email), ''),
    v_first_name,
    v_last_name,
    v_mobile,
    'PENDING'
  );

  -- Assign user academy role
  INSERT INTO public.user_academy_roles (user_id, academy_id, permissions)
  VALUES (NEW.id, v_academy_id, jsonb_build_array(v_role))
  ON CONFLICT (user_id, academy_id) DO NOTHING;

  -- Player creation and linking is deferred to admin review and duplicate resolution

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user() error for user % (role: %): % [%]',
    NEW.id, v_role, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;
