/*
  # Fix speaker message permissions

  1. Changes
    - Update RLS policies for session_messages table to allow speakers to send messages
    - Add policy for speaker message insertion without requiring authentication
    - Modify existing policies to handle both user and speaker messages

  2. Security
    - Ensure speakers can only send messages to their assigned sessions
    - Maintain data integrity by enforcing proper user/speaker ID handling
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;

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