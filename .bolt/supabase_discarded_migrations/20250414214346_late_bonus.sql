/*
  # Add Speaker Access Management

  1. Changes
    - Add access_link column to speakers table if not exists
    - Create speaker_access_tokens table if not exists
    - Add functions for token management
    - Add RLS policies for secure access

  2. Security
    - Enable RLS on speaker_access_tokens table
    - Add policies for token access
    - Ensure proper access control
*/

-- Add access_link to speakers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speakers' AND column_name = 'access_link'
  ) THEN
    ALTER TABLE speakers ADD COLUMN access_link text;
  END IF;
END $$;

-- Create speaker_access_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, speaker_id)
);

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_speakers ss ON ss.session_id = s.id
    WHERE s.id = speaker_access_tokens.session_id
    AND ss.speaker_id = speaker_access_tokens.speaker_id
  )
);

-- Function to generate access token
CREATE OR REPLACE FUNCTION generate_speaker_token(
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

-- Function to generate access link
CREATE OR REPLACE FUNCTION generate_speaker_access_link(
  p_session_id uuid,
  p_speaker_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate token
  v_token := generate_speaker_token(p_session_id, p_speaker_id);
  
  -- Update speaker's access link
  UPDATE speakers
  SET access_link = '/speaker-access/session/' || p_session_id || '?token=' || v_token
  WHERE id = p_speaker_id;
  
  -- Return the full access link
  RETURN '/speaker-access/session/' || p_session_id || '?token=' || v_token;
END;
$$;

-- Trigger function to generate access link when speaker is added to session
CREATE OR REPLACE FUNCTION generate_speaker_access_on_session_link()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM generate_speaker_access_link(NEW.session_id, NEW.speaker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS speaker_session_access_trigger ON session_speakers;
CREATE TRIGGER speaker_session_access_trigger
  AFTER INSERT ON session_speakers
  FOR EACH ROW
  EXECUTE FUNCTION generate_speaker_access_on_session_link();