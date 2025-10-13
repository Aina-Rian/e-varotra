-- Update the meeting URL generation function
CREATE OR REPLACE FUNCTION generate_meeting_url(session_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use relative URL instead of hardcoded domain
  RETURN '/session/' || session_id;
END;
$$;