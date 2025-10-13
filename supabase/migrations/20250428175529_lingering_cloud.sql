/*
  # Fix Speaker Email Null Error

  1. Changes
    - Update create_speaker_user function to properly handle email validation
    - Add better error handling and logging
    - Ensure email is properly set in users table
    - Fix order of operations to prevent null email values

  2. Security
    - Maintain existing security model
    - Ensure proper validation of email addresses
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS create_speaker_user_trigger ON speakers;
DROP FUNCTION IF EXISTS create_speaker_user();

-- Create updated function to handle speaker user creation with better error handling
CREATE OR REPLACE FUNCTION create_speaker_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_password text;
BEGIN
  -- Log the input values for debugging
  RAISE NOTICE 'Creating speaker user with name: %, email: %', NEW.full_name, NEW.email;

  -- Validate email is provided
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RAISE EXCEPTION 'Email is required for speaker creation';
  END IF;

  -- Clean and validate email
  v_email := lower(trim(NEW.email));
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', v_email;
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF FOUND THEN
    -- Use existing user
    RAISE NOTICE 'Using existing user with ID: % for email: %', v_user_id, v_email;
    NEW.user_id := v_user_id;
    
    -- Update users table if needed
    UPDATE public.users
    SET 
      full_name = COALESCE(full_name, NEW.full_name),
      company = COALESCE(company, NEW.company),
      position = COALESCE(position, NEW.position),
      role = COALESCE(role, 'speaker'::user_role),
      email = v_email, -- Ensure email is set
      updated_at = now()
    WHERE id = v_user_id;
    
    RETURN NEW;
  END IF;

  -- Generate random password
  v_password := encode(gen_random_bytes(12), 'hex');

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating new user with ID: % and email: %', v_user_id, v_email;

  -- First create the user profile with explicit email
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      company,
      position,
      role,
      created_at,
      updated_at,
      settings,
      social_links
    )
    VALUES (
      v_user_id,
      v_email, -- Explicitly set email
      NEW.full_name,
      NEW.company,
      NEW.position,
      'speaker',
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb
    );
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: % (email: %)', SQLERRM, v_email;
  END;

  -- Then create auth user
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'full_name', NEW.full_name,
        'company', NEW.company,
        'position', NEW.position,
        'role', 'speaker',
        'email', v_email -- Include email in metadata
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex')
    );
  EXCEPTION WHEN others THEN
    -- Clean up the user profile if auth user creation fails
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE EXCEPTION 'Failed to create auth user: % (email: %)', SQLERRM, v_email;
  END;

  -- Update speaker with user_id
  NEW.user_id := v_user_id;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log any other errors
  RAISE EXCEPTION 'Error in create_speaker_user: % (email: %)', SQLERRM, COALESCE(NEW.email, 'NULL');
END;
$$;

-- Create trigger for speaker user creation
CREATE TRIGGER create_speaker_user_trigger
  BEFORE INSERT ON speakers
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION create_speaker_user();

-- Update any existing speakers with null emails
UPDATE speakers
SET email = lower(regexp_replace(full_name, '[^a-zA-Z0-9]', '', 'g')) || '@speaker.vibees.app'
WHERE email IS NULL;