/*
  # Update speaker access token management

  1. Changes
    - Remove expiration from speaker_access_tokens
    - Update token generation to be permanent
    - Add unique constraint on token
*/

-- Drop existing speaker_access_tokens table
DROP TABLE IF EXISTS speaker_access_tokens CASCADE;

-- Recreate speaker_access_tokens table without expiration
CREATE TABLE speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, speaker_id)
);

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for token access
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (true);

-- Update token generation function
CREATE OR REPLACE FUNCTION generate_speaker_access_token(
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
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update the token
  INSERT INTO speaker_access_tokens (
    session_id,
    speaker_id,
    token
  )
  VALUES (
    p_session_id,
    p_speaker_id,
    v_token
  )
  ON CONFLICT (session_id, speaker_id)
  DO UPDATE SET
    token = v_token;
    
  RETURN v_token;
END;
$$;

-- Create function to handle session speaker linking
CREATE OR REPLACE FUNCTION handle_session_speaker_link()
RETURNS TRIGGER AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate access token
  v_token := generate_speaker_access_token(NEW.session_id, NEW.speaker_id);
  
  -- Update speaker's access link
  UPDATE speakers
  SET access_link = '/speaker-access/session/' || NEW.session_id || '?token=' || v_token
  WHERE id = NEW.speaker_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session_speakers
DROP TRIGGER IF EXISTS session_speaker_link_trigger ON session_speakers;
CREATE TRIGGER session_speaker_link_trigger
  AFTER INSERT ON session_speakers
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_speaker_link();