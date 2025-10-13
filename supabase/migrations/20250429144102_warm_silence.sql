/*
  # Fix Speaker Message Permissions

  1. Changes
    - Drop existing policy for session_messages
    - Create new policy that properly handles speaker messages
    - Remove authentication requirement for message insertion
    - Allow messages to be sent based on speaker_id validation

  2. Security
    - Maintain security by validating speaker_id against session_speakers
    - Ensure messages can only be sent for valid sessions
    - Allow both authenticated users and speakers to send messages
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;
DROP POLICY IF EXISTS "Anyone can view session messages" ON session_messages;

-- Create policy for viewing messages
CREATE POLICY "Anyone can view session messages"
ON session_messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status IN ('published', 'live')
  )
);

-- Create new INSERT policy that handles both users and speakers
CREATE POLICY "Users and speakers can send messages"
ON session_messages
FOR INSERT
TO public
WITH CHECK (
  -- Case 1: Regular authenticated user sending a message
  (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid() AND 
    speaker_id IS NULL AND
    EXISTS (
      SELECT 1 
      FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_messages.session_id 
      AND e.status IN ('published', 'live')
    )
  )
  OR
  -- Case 2: Speaker sending a message (using speaker_id)
  (
    speaker_id IS NOT NULL AND
    user_id IS NULL AND
    EXISTS (
      SELECT 1
      FROM session_speakers ss
      JOIN sessions s ON s.id = ss.session_id
      JOIN events e ON e.id = s.event_id
      WHERE ss.session_id = session_messages.session_id
      AND ss.speaker_id = session_messages.speaker_id
      AND e.status IN ('published', 'live')
    )
  )
);