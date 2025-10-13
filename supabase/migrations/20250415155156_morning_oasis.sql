/*
  # Fix event questions table structure

  1. Changes
    - Add session_id column to event_questions table
    - Update foreign key constraints
    - Add indexes for better performance
    - Update policies for proper access
*/

-- First add session_id column
ALTER TABLE event_questions
ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS event_questions_session_id_idx ON event_questions(session_id);

-- Update policies
DROP POLICY IF EXISTS "Users can view questions for public events" ON event_questions;
DROP POLICY IF EXISTS "Users can create questions for events" ON event_questions;

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

-- Create function to get session questions
CREATE OR REPLACE FUNCTION get_session_questions(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  question text,
  status question_status,
  answer text,
  answered_at timestamptz,
  created_at timestamptz,
  user_info jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
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
  LEFT JOIN users u ON u.id = q.user_id
  WHERE q.session_id = p_session_id
  ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;