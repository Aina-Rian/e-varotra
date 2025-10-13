/*
  # Add speaker access link and meeting URL

  1. Changes
    - Add access_link column to speakers table
    - Add meeting_url column to sessions table
    - Add function to generate meeting URLs
*/

-- Add access_link to speakers table
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS access_link text;

-- Add meeting_url to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS meeting_url text;

-- Create function to generate meeting URL
CREATE OR REPLACE FUNCTION generate_meeting_url(session_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'https://meet.jit.si/vibees-session-' || replace(session_id::text, '-', '');
END;
$$;

-- Create function to generate speaker access link
CREATE OR REPLACE FUNCTION generate_speaker_access_link(
  session_id uuid,
  speaker_id uuid
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Return the full access link
  RETURN current_setting('app.settings.frontend_url') || '/speaker-access/session/' || session_id || '?token=' || v_token;
END;
$$;

-- Add trigger to automatically set meeting_url for new sessions
CREATE OR REPLACE FUNCTION set_session_meeting_url()
RETURNS trigger AS $$
BEGIN
  NEW.meeting_url := generate_meeting_url(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_session_meeting_url_trigger
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_session_meeting_url();