/*
  # Add automatic user creation for speakers

  1. Changes
    - Add trigger to automatically create auth.users for new speakers
    - Add function to handle speaker user creation
    - Update speaker creation to link with auth.users

  2. Security
    - Maintain RLS policies
    - Ensure secure user creation
    - Link speakers with auth.users
*/

-- Create function to generate a random password
CREATE OR REPLACE FUNCTION generate_random_password()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(12), 'hex');
END;
$$;

-- Create function to create speaker user
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
  -- Generate email if not provided
  v_email := NEW.email;
  IF v_email IS NULL THEN
    v_email := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]', '', 'g')) || '@speaker.vibees.app';
  END IF;

  -- Generate random password
  v_password := generate_random_password();

  -- Create user in auth.users
  INSERT INTO auth.users (
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
    '00000000-0000-0000-0000-000000000000',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'full_name', NEW.full_name,
      'company', NEW.company,
      'position', NEW.position
    ),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  )
  RETURNING id INTO v_user_id;

  -- Update speaker with user_id
  NEW.user_id := v_user_id;

  -- Create user profile
  INSERT INTO public.users (
    id,
    full_name,
    company,
    position,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    NEW.full_name,
    NEW.company,
    NEW.position,
    'speaker',
    now(),
    now()
  );

  RETURN NEW;
END;
$$;

-- Create trigger for speaker user creation
DROP TRIGGER IF EXISTS create_speaker_user_trigger ON speakers;
CREATE TRIGGER create_speaker_user_trigger
  BEFORE INSERT ON speakers
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION create_speaker_user();

-- Add email column to speakers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speakers' AND column_name = 'email'
  ) THEN
    ALTER TABLE speakers ADD COLUMN email text;
  END IF;
END $$;

-- Create index on speakers email
CREATE INDEX IF NOT EXISTS speakers_email_idx ON speakers(email);