/*
  # Restore token expiration for speaker access system

  1. Changes
    - Add expires_at column back to speaker_access_tokens table
    - Update token validation to check expiration
    - Maintain unique constraints and indexes
*/

-- Drop and recreate speaker_access_tokens table with expiration
DROP TABLE IF EXISTS speaker_access_tokens CASCADE;

CREATE TABLE speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, speaker_id),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for token access
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (
  expires_at > now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS speaker_access_tokens_token_idx ON speaker_access_tokens(token);
CREATE INDEX IF NOT EXISTS speaker_access_tokens_expires_at_idx ON speaker_access_tokens(expires_at);

-- Update token validation function
CREATE OR REPLACE FUNCTION validate_speaker_access(
  p_session_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM speaker_access_tokens
    WHERE session_id = p_session_id
    AND token = p_token
    AND expires_at > now()
  );
END;
$$;

-- Update token generation function
CREATE OR REPLACE FUNCTION generate_speaker_access_token(
  p_session_id uuid,
  p_speaker_id uuid,
  p_expires_in interval DEFAULT interval '7 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update the token
  INSERT INTO speaker_access_tokens (
    session_id,
    speaker_id,
    token,
    expires_at
  )
  VALUES (
    p_session_id,
    p_speaker_id,
    v_token,
    now() + p_expires_in
  )
  ON CONFLICT (session_id, speaker_id)
  DO UPDATE SET
    token = v_token,
    expires_at = now() + p_expires_in;
    
  RETURN v_token;
END;
$$;