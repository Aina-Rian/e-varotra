/*
  # Fix event_details materialized view permissions

  1. Changes
    - Drop and recreate materialized view with proper permissions
    - Create secure refresh function
    - Set up proper triggers
    - Grant necessary permissions

  2. Security
    - Uses security definer for safe refreshes
    - Maintains data access control
    - Allows proper view access
*/

-- Drop existing view and functions
DROP MATERIALIZED VIEW IF EXISTS event_details CASCADE;
DROP FUNCTION IF EXISTS refresh_event_details() CASCADE;
DROP FUNCTION IF EXISTS refresh_event_details_secure() CASCADE;

-- Recreate materialized view
CREATE MATERIALIZED VIEW event_details AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.status as event_status,
  (
    SELECT json_agg(json_build_object(
      'id', r.id,
      'name', r.name,
      'type', r.type,
      'capacity', r.capacity
    ))
    FROM rooms r
    JOIN sessions s ON s.room_id = r.id
    WHERE s.event_id = e.id
  ) as rooms,
  (
    SELECT json_agg(json_build_object(
      'id', sp.id,
      'full_name', sp.full_name,
      'company', sp.company,
      'title', sp.position
    ))
    FROM speakers sp
    JOIN session_speakers ss ON ss.speaker_id = sp.id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.event_id = e.id
  ) as speakers
FROM events e;

-- Create index on materialized view
CREATE UNIQUE INDEX event_details_id_idx ON event_details (event_id);

-- Create secure refresh function
CREATE OR REPLACE FUNCTION refresh_event_details_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY event_details;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION refresh_event_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM refresh_event_details_secure();
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER refresh_event_details_events
  AFTER INSERT OR DELETE OR UPDATE ON events
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_sessions
  AFTER INSERT OR DELETE OR UPDATE ON sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_rooms
  AFTER INSERT OR DELETE OR UPDATE ON rooms
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_speakers
  AFTER INSERT OR DELETE OR UPDATE ON speakers
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_event_details();

-- Grant permissions
GRANT SELECT ON event_details TO authenticated, anon;

-- Initial refresh
SELECT refresh_event_details_secure();