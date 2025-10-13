/*
  # Create session questions table

  1. New Tables
    - `session_questions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to users)
      - `question` (text)
      - `status` (question_status enum)
      - `answer` (text, nullable)
      - `answered_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `session_questions` table
    - Add policies for:
      - Public can view questions for published sessions
      - Authenticated users can create questions
      - Session owners can manage questions
*/

-- Create the session_questions table
CREATE TABLE IF NOT EXISTS public.session_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  status question_status NOT NULL DEFAULT 'pending',
  answer text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS session_questions_session_id_idx ON public.session_questions(session_id);
CREATE INDEX IF NOT EXISTS session_questions_user_id_idx ON public.session_questions(user_id);
CREATE INDEX IF NOT EXISTS session_questions_status_idx ON public.session_questions(status);
CREATE INDEX IF NOT EXISTS session_questions_created_at_idx ON public.session_questions(created_at);

-- Enable Row Level Security
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can view questions for published sessions
CREATE POLICY "Questions viewable for public sessions"
  ON public.session_questions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_questions.session_id
      AND e.status IN ('published', 'live')
    )
  );

-- Authenticated users can create questions
CREATE POLICY "Users can create questions for sessions"
  ON public.session_questions
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_questions.session_id
      AND e.status IN ('published', 'live')
    )
  );

-- Session owners can manage questions
CREATE POLICY "Session owners can manage questions"
  ON public.session_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_questions.session_id
      AND e.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN events e ON e.id = s.event_id
      WHERE s.id = session_questions.session_id
      AND e.organizer_id = auth.uid()
    )
  );