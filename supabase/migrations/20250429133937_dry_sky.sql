/*
  # Fix session messages RLS policy

  1. Changes
    - Update INSERT policy for session_messages to properly handle speaker access
    - Ensure speakers can send messages using their speaker_id
    - Maintain existing user message functionality

  2. Security
    - Policy checks for valid speaker_id and session_id
    - Maintains existing user message security
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;

-- Create updated policy that properly handles both user and speaker messages
CREATE POLICY "Users and speakers can send messages"
ON session_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Case 1: Regular user sending a message (user_id is set, speaker_id is null)
  (
    (user_id = auth.uid() AND speaker_id IS NULL) AND
    EXISTS (
      SELECT 1 
      FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_messages.session_id 
      AND e.status IN ('published', 'live')
    )
  )
  OR
  -- Case 2: Speaker sending a message (speaker_id is set, user_id is null)
  (
    (speaker_id IS NOT NULL AND user_id IS NULL) AND
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