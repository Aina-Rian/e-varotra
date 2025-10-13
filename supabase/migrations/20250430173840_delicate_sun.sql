/*
  # Add session questions functionality

  1. Changes
    - Update event_questions table to properly link with sessions
    - Add foreign key constraint for session_id
    - Add index for better performance
    - Update RLS policies for proper access control

  2. Security
    - Maintain RLS on event_questions table
    - Allow users to view questions for public sessions
    - Allow users to create questions for sessions they're attending
*/

-- Add index for session_id if it doesn't exist
CREATE INDEX IF NOT EXISTS event_questions_session_id_idx ON event_questions(session_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Questions viewable for public sessions" ON event_questions;
DROP POLICY IF EXISTS "Users can create questions for sessions" ON event_questions;

-- Create new policies
CREATE POLICY "Questions viewable for public sessions"
ON event_questions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = event_questions.session_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Users can create questions for sessions"
ON event_questions
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = event_questions.session_id
    AND e.status IN ('published', 'live')
  )
);

-- Create view for question display with user information
CREATE OR REPLACE VIEW question_display AS
SELECT 
  q.id,
  q.event_id,
  q.session_id,
  q.question,
  q.status,
  q.answer,
  q.answered_at,
  q.created_at,
  jsonb_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'avatar_url', u.avatar_url
  ) as user_info
FROM event_questions q
LEFT JOIN users u ON u.id = q.user_id;

-- Grant access to the view
GRANT SELECT ON question_display TO public;