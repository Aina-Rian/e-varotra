/*
  # Fix speaker message permissions

  1. Changes
    - Update RLS policies for session_messages table to allow speakers to send messages
    - Add policy for speaker message insertion
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
TO authenticated
WITH CHECK (
  (
    -- Case 1: Regular user sending a message
    (
      user_id = auth.uid() AND 
      speaker_id IS NULL
    )
    OR
    -- Case 2: Speaker sending a message
    (
      speaker_id IN (
        SELECT speaker_id 
        FROM session_speakers 
        WHERE session_id = session_messages.session_id
      ) AND
      user_id IS NULL
    )
  )
  AND
  -- Verify session exists and is active
  EXISTS (
    SELECT 1
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status = ANY (ARRAY['published'::event_status, 'live'::event_status])
  )
);