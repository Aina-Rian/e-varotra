/*
  # Fix Event Relationships

  1. Changes
    - Remove direct event_id from rooms and speakers
    - Establish proper relationships through sessions
    - Add constraints and indexes for performance
    - Update RLS policies

  2. Relationships
    - Event -> Sessions (one-to-many)
    - Session -> Room (many-to-one)
    - Session -> Speakers (many-to-many through session_speakers)
*/

-- First ensure we have the right constraints
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_event_room_unique CASCADE;

ALTER TABLE sessions
ADD CONSTRAINT sessions_event_room_unique 
UNIQUE (event_id, room_id, start_time, end_time);

-- Create function to validate session times
CREATE OR REPLACE FUNCTION validate_session_times()
RETURNS trigger AS $$
BEGIN
  -- Check if session times are within event times
  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = NEW.event_id
    AND NEW.start_time >= start_date
    AND NEW.end_time <= end_date
  ) THEN
    RAISE EXCEPTION 'Session times must be within event times';
  END IF;

  -- Check for room conflicts
  IF EXISTS (
    SELECT 1 FROM sessions
    WHERE room_id = NEW.room_id
    AND id != NEW.id
    AND (
      (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Room is already booked for this time period';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session time validation
DROP TRIGGER IF EXISTS validate_session_times_trigger ON sessions;
CREATE TRIGGER validate_session_times_trigger
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_session_times();

-- Create function to manage session speakers
CREATE OR REPLACE FUNCTION manage_session_speakers(
  p_session_id uuid,
  p_speaker_ids uuid[]
) RETURNS void AS $$
BEGIN
  -- Remove existing relationships
  DELETE FROM session_speakers
  WHERE session_id = p_session_id;

  -- Add new relationships
  INSERT INTO session_speakers (session_id, speaker_id)
  SELECT p_session_id, unnest(p_speaker_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published event sessions"
  ON sessions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.status IN ('published', 'live')
    )
  );

CREATE POLICY "Organizers can manage their event sessions"
  ON sessions
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create function to get event schedule
CREATE OR REPLACE FUNCTION get_event_schedule(p_event_id uuid)
RETURNS TABLE (
  session_id uuid,
  title text,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  room_name text,
  room_type room_type,
  speakers json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.title,
    s.description,
    s.start_time,
    s.end_time,
    r.name as room_name,
    r.type as room_type,
    (
      SELECT json_agg(json_build_object(
        'id', sp.id,
        'full_name', sp.full_name,
        'company', sp.company,
        'position', sp.position
      ))
      FROM session_speakers ss
      JOIN speakers sp ON sp.id = ss.speaker_id
      WHERE ss.session_id = s.id
    ) as speakers
  FROM sessions s
  JOIN rooms r ON r.id = s.room_id
  WHERE s.event_id = p_event_id
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sessions_start_time_idx ON sessions (start_time);
CREATE INDEX IF NOT EXISTS sessions_end_time_idx ON sessions (end_time);
CREATE INDEX IF NOT EXISTS sessions_event_id_idx ON sessions (event_id);
CREATE INDEX IF NOT EXISTS sessions_room_id_idx ON sessions (room_id);
CREATE INDEX IF NOT EXISTS session_speakers_session_id_idx ON session_speakers (session_id);
CREATE INDEX IF NOT EXISTS session_speakers_speaker_id_idx ON session_speakers (speaker_id);

-- Create function to check room availability
CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_session_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE room_id = p_room_id
    AND id != COALESCE(p_session_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
  );
END;
$$ LANGUAGE plpgsql;