/*
  # Fix exhibitor user creation process

  1. Changes
    - Drop and recreate the create_exhibitor_user function
    - Ensure proper order of operations: auth.users first, then public.users
    - Add better error handling and validation
    - Fix foreign key constraint violation

  2. Security
    - Maintain existing security model
    - Ensure proper validation of email addresses
    - Handle existing users correctly
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS create_exhibitor_user_trigger ON exhibitors;
DROP FUNCTION IF EXISTS create_exhibitor_user();

-- Create updated function to handle exhibitor user creation
CREATE OR REPLACE FUNCTION create_exhibitor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_password text;
BEGIN
  -- Validate email is provided
  IF NEW.contact_email IS NULL OR trim(NEW.contact_email) = '' THEN
    RAISE EXCEPTION 'Email is required for exhibitor creation';
  END IF;

  -- Clean and validate email
  v_email := lower(trim(NEW.contact_email));
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', v_email;
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF FOUND THEN
    -- Use existing user
    RAISE NOTICE 'Using existing user with ID: % for email: %', v_user_id, v_email;
    NEW.user_id := v_user_id;
    
    -- Check if user profile exists in public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
      -- Update users table if needed
      UPDATE public.users
      SET 
        full_name = COALESCE(full_name, NEW.company_name),
        company = COALESCE(company, NEW.company_name),
        role = COALESCE(role, 'exhibitor'::user_role),
        email = v_email, -- Ensure email is set
        updated_at = now()
      WHERE id = v_user_id;
    ELSE
      -- Create user profile if it doesn't exist
      INSERT INTO public.users (
        id,
        email,
        full_name,
        company,
        role,
        created_at,
        updated_at,
        settings,
        social_links
      )
      VALUES (
        v_user_id,
        v_email,
        NEW.company_name,
        NEW.company_name,
        'exhibitor',
        now(),
        now(),
        '{}'::jsonb,
        '{}'::jsonb
      );
    END IF;
    
    RETURN NEW;
  END IF;

  -- Generate random password
  v_password := encode(gen_random_bytes(12), 'hex');

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating new user with ID: % and email: %', v_user_id, v_email;

  -- First create auth user
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
        'full_name', NEW.company_name,
        'company', NEW.company_name,
        'role', 'exhibitor',
        'email', v_email
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex')
    );
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Failed to create auth user: % (email: %)', SQLERRM, v_email;
  END;

  -- Then create the user profile
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      company,
      role,
      created_at,
      updated_at,
      settings,
      social_links
    )
    VALUES (
      v_user_id,
      v_email,
      NEW.company_name,
      NEW.company_name,
      'exhibitor',
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb
    );
  EXCEPTION WHEN others THEN
    -- Clean up the auth user if profile creation fails
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE EXCEPTION 'Failed to create user profile: % (email: %)', SQLERRM, v_email;
  END;

  -- Update exhibitor with user_id
  NEW.user_id := v_user_id;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log any other errors
  RAISE EXCEPTION 'Error in create_exhibitor_user: % (email: %)', SQLERRM, COALESCE(NEW.contact_email, 'NULL');
END;
$$;

-- Create trigger for exhibitor user creation
CREATE TRIGGER create_exhibitor_user_trigger
  BEFORE INSERT ON exhibitors
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION create_exhibitor_user();