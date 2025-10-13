/*
  # Update session messages RLS policy

  1. Changes
    - Add new RLS policy to allow speakers to send messages through speaker access page
    - Policy checks if the message is being sent by a speaker associated with the session
    - Allows messages with speaker_id even without user_id match

  2. Security
    - Only allows speakers to send messages for sessions they are assigned to
    - Maintains existing policies for regular user messages
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can send messages" ON session_messages;

-- Create new insert policy that handles both regular users and speakers
CREATE POLICY "Users and speakers can send messages" ON session_messages
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- Regular user case
    (user_id = auth.uid() AND speaker_id IS NULL)
    OR
    -- Speaker case - check if speaker is associated with the session
    (speaker_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM session_speakers ss
      WHERE ss.session_id = session_messages.session_id
      AND ss.speaker_id = session_messages.speaker_id
    ))
  )
  AND
  -- Verify session is in a published or live event
  EXISTS (
    SELECT 1
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status = ANY (ARRAY['published'::event_status, 'live'::event_status])
  )
);