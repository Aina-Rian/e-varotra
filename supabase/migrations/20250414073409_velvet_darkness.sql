/*
  # Add Event Relationships Migration

  1. Changes
    - Add event_id to speakers table
    - Add event_speakers junction table
    - Add indexes and foreign key constraints
    - Update existing policies

  2. Security
    - Enable RLS on new tables
    - Add policies for managing relationships
*/

-- Add event_id to speakers table
ALTER TABLE speakers
ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

-- Create event_speakers junction table
CREATE TABLE IF NOT EXISTS event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'speaker',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, speaker_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS speakers_event_id_idx ON speakers(event_id);
CREATE INDEX IF NOT EXISTS event_speakers_event_id_idx ON event_speakers(event_id);
CREATE INDEX IF NOT EXISTS event_speakers_speaker_id_idx ON event_speakers(speaker_id);

-- Enable RLS on new table
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;

-- Create policies for event_speakers
CREATE POLICY "Organizers can manage event speakers"
  ON event_speakers
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Public can view event speakers"
  ON event_speakers
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.status IN ('published', 'live')
    )
  );

-- Update speakers policies
CREATE POLICY "Organizers can manage speakers for their events"
  ON speakers
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = speakers.event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = speakers.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create function to manage speaker relationships
CREATE OR REPLACE FUNCTION manage_event_speakers(
  p_event_id uuid,
  p_speaker_ids uuid[]
) RETURNS void AS $$
BEGIN
  -- Delete existing relationships not in the new list
  DELETE FROM event_speakers
  WHERE event_id = p_event_id
  AND speaker_id != ALL(p_speaker_ids);

  -- Insert new relationships
  INSERT INTO event_speakers (event_id, speaker_id)
  SELECT p_event_id, unnest(p_speaker_ids)
  ON CONFLICT (event_id, speaker_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to maintain speaker relationships
CREATE OR REPLACE FUNCTION update_event_speakers()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Clean up speaker relationships when event is deleted
    DELETE FROM event_speakers WHERE event_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_speakers_cleanup_trigger
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_speakers();

-- Update sessions table to ensure proper relationships
ALTER TABLE sessions
ADD CONSTRAINT sessions_event_room_unique UNIQUE (event_id, room_id);

-- Create function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
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