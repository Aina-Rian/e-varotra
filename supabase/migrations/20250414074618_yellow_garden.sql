/*
  # Fix Event Relationships Structure

  1. Changes
    - Drop all dependent policies first
    - Remove event_id columns safely
    - Recreate policies and functions
    - Create materialized view for event details
*/

-- First drop all dependent policies
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON rooms;
DROP POLICY IF EXISTS "Public speaker profiles are viewable by everyone" ON speakers;
DROP POLICY IF EXISTS "Organizers can manage speakers for their events" ON speakers;

-- Now we can safely remove the columns
ALTER TABLE rooms DROP COLUMN IF EXISTS event_id CASCADE;
ALTER TABLE speakers DROP COLUMN IF EXISTS event_id CASCADE;

-- Add constraints to ensure proper relationships
ALTER TABLE sessions
ADD CONSTRAINT valid_room_assignment
CHECK (room_id IS NOT NULL);

-- Create new RLS policies for rooms
CREATE POLICY "Public rooms are viewable by everyone"
ON rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.room_id = rooms.id
    AND e.status IN ('published', 'live')
  )
);

-- Create new RLS policies for speakers
CREATE POLICY "Public speaker profiles are viewable by everyone"
ON speakers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_speakers ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN events e ON e.id = s.event_id
    WHERE ss.speaker_id = speakers.id
    AND e.status IN ('published', 'live')
  )
);

-- Create function to get event rooms
CREATE OR REPLACE FUNCTION get_event_rooms(p_event_id uuid)
RETURNS TABLE (
  room_id uuid,
  room_name text,
  room_type room_type,
  room_capacity integer,
  session_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    r.id as room_id,
    r.name as room_name,
    r.type as room_type,
    r.capacity as room_capacity,
    COUNT(s.id) OVER (PARTITION BY r.id) as session_count
  FROM rooms r
  JOIN sessions s ON s.room_id = r.id
  WHERE s.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get event speakers
CREATE OR REPLACE FUNCTION get_event_speakers(p_event_id uuid)
RETURNS TABLE (
  speaker_id uuid,
  speaker_name text,
  speaker_company text,
  speaker_title text,
  session_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    sp.id as speaker_id,
    sp.full_name as speaker_name,
    sp.company as speaker_company,
    sp.position as speaker_title,
    COUNT(s.id) OVER (PARTITION BY sp.id) as session_count
  FROM speakers sp
  JOIN session_speakers ss ON ss.speaker_id = sp.id
  JOIN sessions s ON s.id = ss.session_id
  WHERE s.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for event details
DROP MATERIALIZED VIEW IF EXISTS event_details CASCADE;
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

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_event_details()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY event_details;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view
CREATE TRIGGER refresh_event_details_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_rooms
AFTER INSERT OR UPDATE OR DELETE ON rooms
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_details();

CREATE TRIGGER refresh_event_details_speakers
AFTER INSERT OR UPDATE OR DELETE ON speakers
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_event_details();