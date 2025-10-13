/*
  # Add speaker authentication policy

  1. Changes
    - Add policy to allow speakers to send messages
    - Update session_messages RLS policy
    - Fix authentication for speaker access page
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;

-- Create new policy that properly handles speaker authentication
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