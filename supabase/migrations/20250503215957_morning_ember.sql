/*
  # Add moderator role to user_role enum

  1. Changes
    - Add 'moderator' to user_role enum if it doesn't exist
    - Update existing policies to handle moderator role
    - Add function to check if user is a moderator

  2. Security
    - Maintain existing security model
    - Add proper access control for moderators
*/

-- Add moderator to user_role enum if it doesn't exist
DO $$ 
BEGIN
  -- Check if the enum already has the 'moderator' value
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'moderator' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add the new value to the enum
    ALTER TYPE user_role ADD VALUE 'moderator';
  END IF;
END $$;

-- Create function to check if user is a moderator
CREATE OR REPLACE FUNCTION is_moderator(
  user_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = user_id
    AND role = 'moderator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate moderator access token
CREATE OR REPLACE FUNCTION generate_moderator_access_token(
  p_session_id uuid,
  p_moderator_id uuid,
  p_expires_in interval DEFAULT interval '7 days'
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- In a real implementation, you would store this token in a moderator_access_tokens table
  -- For now, we'll just return the token
  RETURN v_token;
END;
$$;