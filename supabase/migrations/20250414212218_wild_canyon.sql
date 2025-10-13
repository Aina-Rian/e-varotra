/*
  # Update meeting URL generation to use local instance

  1. Changes
    - Update generate_meeting_url function to use local URL
    - Add domain configuration
*/

-- Update function to generate meeting URL with local domain
CREATE OR REPLACE FUNCTION generate_meeting_url(session_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'http://localhost:8000/vibees-session-' || replace(session_id::text, '-', '');
END;
$$;