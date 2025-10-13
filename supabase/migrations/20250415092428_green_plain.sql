/*
  # Disable speaker invitation emails

  1. Changes
    - Update session speaker linking to skip email sending
    - Keep access token generation for authentication
    - Maintain existing functionality without emails
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS session_speaker_link_trigger ON session_speakers;
DROP FUNCTION IF EXISTS handle_session_speaker_link();

-- Create updated function to handle session speaker linking without email
CREATE OR REPLACE FUNCTION handle_session_speaker_link()
RETURNS TRIGGER AS $$
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
    NEW.session_id,
    NEW.speaker_id,
    v_token
  )
  ON CONFLICT (session_id, speaker_id)
  DO UPDATE SET
    token = v_token;
  
  -- Update speaker's access link
  UPDATE speakers
  SET access_link = '/speaker-access/session/' || NEW.session_id || '?token=' || v_token
  WHERE id = NEW.speaker_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for session_speakers
CREATE TRIGGER session_speaker_link_trigger
  AFTER INSERT ON session_speakers
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_speaker_link();