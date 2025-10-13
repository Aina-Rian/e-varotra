/*
  # Fix Event Relationships and Policies

  1. Changes
    - Drop all existing policies first
    - Recreate policies with proper checks
    - Update relationship handling between events, rooms, sessions, and speakers

  2. Security
    - Maintain proper access control
    - Ensure organizers can manage their content
    - Allow public access to published content
*/

-- First drop all existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop room policies
  DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON rooms;
  DROP POLICY IF EXISTS "Organizers can manage rooms" ON rooms;
  
  -- Drop speaker policies
  DROP POLICY IF EXISTS "Public speaker profiles are viewable by everyone" ON speakers;
  DROP POLICY IF EXISTS "Organizers can manage speakers" ON speakers;
  
  -- Drop session_speakers policies
  DROP POLICY IF EXISTS "Public can view session speakers" ON session_speakers;
  DROP POLICY IF EXISTS "Organizers can manage session speakers" ON session_speakers;
  
  -- Drop sessions policies
  DROP POLICY IF EXISTS "Public can view published event sessions" ON sessions;
  DROP POLICY IF EXISTS "Organizers can manage their event sessions" ON sessions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Recreate policies for rooms
CREATE POLICY "Rooms viewable by everyone"
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

CREATE POLICY "Rooms manageable by organizers"
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

-- Recreate policies for speakers
CREATE POLICY "Speakers viewable by everyone"
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

CREATE POLICY "Speakers manageable by organizers"
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

-- Recreate policies for session_speakers
CREATE POLICY "Session speakers viewable by everyone"
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

CREATE POLICY "Session speakers manageable by organizers"
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

-- Recreate policies for sessions
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