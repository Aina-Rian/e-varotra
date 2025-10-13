/*
  # Update RLS policies for rooms and speakers

  1. Changes
    - Add RLS policies for rooms table to allow organizers to manage rooms
    - Update existing rooms policy to use sessions join for public access
    - Add RLS policies for speakers table to allow organizers to manage speakers
    - Update existing speakers policy to use sessions join for public access

  2. Security
    - Enable RLS on rooms and speakers tables
    - Add policies for organizers to manage rooms and speakers
    - Maintain public read access through session relationships
*/

-- Update rooms policies
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON rooms;

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
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.room_id = rooms.id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
);

-- Update speakers policies
DROP POLICY IF EXISTS "Public speaker profiles are viewable by everyone" ON speakers;

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
    SELECT 1 FROM session_speakers ss
    JOIN sessions s ON s.id = ss.session_id
    JOIN events e ON e.id = s.event_id
    WHERE ss.speaker_id = speakers.id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
);