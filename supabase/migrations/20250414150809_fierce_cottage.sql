/*
  # Fix Event Sessions Relationships

  1. Changes
    - Add event_sessions table to properly link events and sessions
    - Update foreign key constraints
    - Add proper indexes and policies
    - Fix session creation logic

  2. Security
    - Enable RLS on new table
    - Add policies for proper access control
*/

-- First drop all dependent policies
DO $$ 
BEGIN
  -- Drop session policies
  DROP POLICY IF EXISTS "Public sessions are viewable by everyone" ON sessions;
  DROP POLICY IF EXISTS "Sessions viewable when published" ON sessions;
  DROP POLICY IF EXISTS "Sessions manageable by organizers" ON sessions;
  
  -- Drop room policies
  DROP POLICY IF EXISTS "Rooms viewable by everyone" ON rooms;
  DROP POLICY IF EXISTS "Rooms manageable by organizers" ON rooms;
  
  -- Drop speaker policies
  DROP POLICY IF EXISTS "Speakers viewable by everyone" ON speakers;
  DROP POLICY IF EXISTS "Speakers manageable by organizers" ON speakers;
  
  -- Drop session_speakers policies
  DROP POLICY IF EXISTS "Session speakers viewable by everyone" ON session_speakers;
  DROP POLICY IF EXISTS "Session speakers manageable by organizers" ON session_speakers;
END $$;

-- Drop materialized view that depends on event_id
DROP MATERIALIZED VIEW IF EXISTS event_details CASCADE;

-- Now we can safely modify the sessions table
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_event_id_fkey CASCADE;
ALTER TABLE sessions DROP COLUMN IF EXISTS event_id CASCADE;

-- Create event_sessions table
CREATE TABLE IF NOT EXISTS event_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS event_sessions_event_id_idx ON event_sessions(event_id);
CREATE INDEX IF NOT EXISTS event_sessions_session_id_idx ON event_sessions(session_id);
CREATE INDEX IF NOT EXISTS event_sessions_display_order_idx ON event_sessions(display_order);

-- Enable RLS
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for event_sessions
CREATE POLICY "Public can view event sessions"
ON event_sessions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sessions.event_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Organizers can manage event sessions"
ON event_sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sessions.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_sessions.event_id
    AND e.organizer_id = auth.uid()
  )
);

-- Recreate policies for sessions using event_sessions relationship
CREATE POLICY "Sessions viewable when published"
ON sessions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM event_sessions es
    JOIN events e ON e.id = es.event_id
    WHERE es.session_id = sessions.id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Sessions manageable by organizers"
ON sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_sessions es
    JOIN events e ON e.id = es.event_id
    WHERE es.session_id = sessions.id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_sessions es
    JOIN events e ON e.id = es.event_id
    WHERE es.session_id = sessions.id
    AND e.organizer_id = auth.uid()
  )
);

-- Create function to get event sessions
CREATE OR REPLACE FUNCTION get_event_sessions(p_event_id uuid)
RETURNS TABLE (
  session_id uuid,
  title text,
  description text,
  type session_type,
  start_time timestamptz,
  end_time timestamptz,
  room_name text,
  room_type room_type,
  max_attendees integer,
  current_attendees integer,
  display_order integer,
  speakers jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.title,
    s.description,
    s.type,
    s.start_time,
    s.end_time,
    r.name as room_name,
    r.type as room_type,
    s.max_attendees,
    s.current_attendees,
    es.display_order,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', sp.id,
        'full_name', sp.full_name,
        'company', sp.company,
        'position', sp.position,
        'photo_url', sp.photo_url
      ))
      FROM session_speakers ss
      JOIN speakers sp ON sp.id = ss.speaker_id
      WHERE ss.session_id = s.id
    ) as speakers
  FROM event_sessions es
  JOIN sessions s ON s.id = es.session_id
  LEFT JOIN rooms r ON r.id = s.room_id
  WHERE es.event_id = p_event_id
  ORDER BY es.display_order, s.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate materialized view with new relationships
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
    JOIN event_sessions es ON es.session_id = s.id
    WHERE es.event_id = e.id
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
    JOIN event_sessions es ON es.session_id = s.id
    WHERE es.event_id = e.id
  ) as speakers
FROM events e;

-- Create index on materialized view
CREATE UNIQUE INDEX event_details_id_idx ON event_details (event_id);

-- Refresh the view
REFRESH MATERIALIZED VIEW event_details;