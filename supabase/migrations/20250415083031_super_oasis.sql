-- Update the meeting URL generation function
CREATE OR REPLACE FUNCTION generate_meeting_url(session_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use custom Jitsi Meet server
  RETURN 'https://vibees.ipv64.de/' || replace(session_id::text, '-', '');
END;
$$;