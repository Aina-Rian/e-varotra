/*
  # Update RLS policies for rooms and speakers

  1. Changes
    - Drop existing policies
    - Add new policies for rooms and speakers tables
    - Allow organizers to manage their event resources
    - Enable public access through proper table relationships

  2. Security
    - Maintain RLS on all tables
    - Ensure proper access control through table relationships
    - Allow organizers to manage their resources
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON rooms;
DROP POLICY IF EXISTS "Organizers can manage rooms" ON rooms;
DROP POLICY IF EXISTS "Public speaker profiles are viewable by everyone" ON speakers;
DROP POLICY IF EXISTS "Organizers can manage speakers" ON speakers;

-- Create new policies for rooms
CREATE POLICY "Public rooms are viewable by everyone" 
ON rooms
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.room_id = rooms.id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Organizers can manage rooms"
ON rooms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
);

-- Create new policies for speakers
CREATE POLICY "Public speaker profiles are viewable by everyone"
ON speakers
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM session_speakers ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN events e ON e.id = s.event_id
    WHERE ss.speaker_id = speakers.id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Organizers can manage speakers"
ON speakers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
);

-- Create policies for session_speakers
CREATE POLICY "Public can view session speakers"
ON session_speakers
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_speakers.session_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Organizers can manage session speakers"
ON session_speakers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_speakers.session_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_speakers.session_id
    AND e.organizer_id = auth.uid()
  )
);