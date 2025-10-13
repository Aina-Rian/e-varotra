/*
  # Add direct event relationship to sessions table

  1. Changes
    - Add event_id column to sessions table
    - Drop event_sessions table
    - Update foreign key constraints
    - Update policies for direct event relationship
    - Update materialized view
*/

-- First drop the event_sessions table and its dependencies
DROP MATERIALIZED VIEW IF EXISTS event_details;
DROP TABLE IF EXISTS event_sessions;

-- Add event_id to sessions table
ALTER TABLE sessions 
ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS sessions_event_id_idx ON sessions(event_id);
CREATE INDEX IF NOT EXISTS sessions_start_time_idx ON sessions(start_time);
CREATE INDEX IF NOT EXISTS sessions_end_time_idx ON sessions(end_time);

-- Update sessions policies
DROP POLICY IF EXISTS "Sessions viewable when published" ON sessions;
DROP POLICY IF EXISTS "Sessions manageable by organizers" ON sessions;

CREATE POLICY "Sessions viewable when published"
ON sessions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = sessions.event_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Sessions manageable by organizers"
ON sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = sessions.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = sessions.event_id
    AND e.organizer_id = auth.uid()
  )
);

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

-- Refresh the view
REFRESH MATERIALIZED VIEW event_details;