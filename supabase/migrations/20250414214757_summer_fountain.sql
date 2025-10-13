/*
  # Fix Speaker Access Link Generation

  1. Changes
    - Add trigger for generating access links on speaker creation
    - Update speaker creation logic to ensure access links are generated
    - Fix session speaker linking to generate access tokens

  2. Security
    - Maintain RLS policies
    - Ensure secure token generation
*/

-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS session_speaker_link_trigger ON session_speakers;
DROP FUNCTION IF EXISTS handle_session_speaker_link();
DROP FUNCTION IF EXISTS generate_speaker_access_link(uuid,uuid);
DROP FUNCTION IF EXISTS ensure_speaker_access_links();

-- Create function to generate access link
CREATE FUNCTION generate_speaker_access_link(
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
    token,
    expires_at
  )
  VALUES (
    p_session_id,
    p_speaker_id,
    v_token,
    now() + interval '7 days'
  )
  ON CONFLICT (session_id, speaker_id)
  DO UPDATE SET
    token = v_token,
    expires_at = now() + interval '7 days';
  
  -- Update speaker's access link
  UPDATE speakers
  SET access_link = '/speaker-access/session/' || p_session_id || '?token=' || v_token
  WHERE id = p_speaker_id;
  
  RETURN '/speaker-access/session/' || p_session_id || '?token=' || v_token;
END;
$$;

-- Create function to handle speaker session linking
CREATE FUNCTION handle_session_speaker_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate access link for the new speaker-session pair
  PERFORM generate_speaker_access_link(NEW.session_id, NEW.speaker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session_speakers
CREATE TRIGGER session_speaker_link_trigger
  AFTER INSERT ON session_speakers
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_speaker_link();

-- Create function to ensure all speakers have access links
CREATE FUNCTION ensure_speaker_access_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate access links for any speaker-session pairs that don't have them
  INSERT INTO speaker_access_tokens (session_id, speaker_id, token, expires_at)
  SELECT 
    ss.session_id,
    ss.speaker_id,
    encode(gen_random_bytes(32), 'hex'),
    now() + interval '7 days'
  FROM session_speakers ss
  LEFT JOIN speaker_access_tokens sat 
    ON sat.session_id = ss.session_id 
    AND sat.speaker_id = ss.speaker_id
  WHERE sat.id IS NULL;

  -- Update access_link for speakers
  UPDATE speakers s
  SET access_link = (
    SELECT '/speaker-access/session/' || sat.session_id || '?token=' || sat.token
    FROM speaker_access_tokens sat
    WHERE sat.speaker_id = s.id
    LIMIT 1
  )
  WHERE s.access_link IS NULL
  AND EXISTS (
    SELECT 1 FROM session_speakers ss
    WHERE ss.speaker_id = s.id
  );
END;
$$;

-- Run the function to fix any existing speakers without access links
SELECT ensure_speaker_access_links();