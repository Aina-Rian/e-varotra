/*
  # Fix session messages RLS policy

  1. Changes
    - Drop existing INSERT policy for session_messages
    - Create new INSERT policy that properly handles both regular users and speakers
    - Policy checks:
      - For regular users: user_id matches authenticated user and speaker_id is null
      - For speakers: speaker_id exists in session_speakers table for the session
      - Session must be in a published or live event

  2. Security
    - Ensures speakers can only send messages for sessions they are assigned to
    - Maintains existing security for regular user messages
    - Preserves event status checks
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;

-- Create new INSERT policy with proper speaker access checks
CREATE POLICY "Users and speakers can send messages" ON session_messages
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- Regular user messages (no speaker_id)
    (user_id = auth.uid() AND speaker_id IS NULL)
    OR
    -- Speaker messages (with speaker_id)
    (
      speaker_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM session_speakers ss
        WHERE ss.session_id = session_messages.session_id
        AND ss.speaker_id = session_messages.speaker_id
      )
    )
  )
  AND
  -- Session must be in a published or live event
  EXISTS (
    SELECT 1 
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status IN ('published', 'live')
  )
);