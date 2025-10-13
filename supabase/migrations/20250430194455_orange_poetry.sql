-- Create the session_questions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_questions') THEN
    -- Create the session_questions table
    CREATE TABLE public.session_questions (
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
    CREATE INDEX session_questions_session_id_idx ON public.session_questions(session_id);
    CREATE INDEX session_questions_user_id_idx ON public.session_questions(user_id);
    CREATE INDEX session_questions_status_idx ON public.session_questions(status);
    CREATE INDEX session_questions_created_at_idx ON public.session_questions(created_at);

    -- Enable Row Level Security
    ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Questions viewable for public sessions" ON public.session_questions;
  DROP POLICY IF EXISTS "Users can create questions for sessions" ON public.session_questions;
  DROP POLICY IF EXISTS "Session owners can manage questions" ON public.session_questions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  -- Public can view questions for published sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_questions' 
    AND policyname = 'Questions viewable for public sessions'
  ) THEN
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
  END IF;

  -- Authenticated users can create questions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_questions' 
    AND policyname = 'Users can create questions for sessions'
  ) THEN
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
  END IF;

  -- Session owners can manage questions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_questions' 
    AND policyname = 'Session owners can manage questions'
  ) THEN
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
  END IF;
END $$;

-- Enable realtime for session_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'session_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_questions;
  END IF;
END
$$;

-- Drop the view if it exists to avoid conflicts
DROP VIEW IF EXISTS question_display;

-- Create view for question display with user information
CREATE OR REPLACE VIEW question_display AS
SELECT 
  q.id,
  q.session_id,
  q.question,
  q.status,
  q.answer,
  q.answered_at,
  q.created_at,
  jsonb_build_object(
    'id', u.id,
    'full_name', COALESCE(u.full_name, 'Anonymous User'),
    'avatar_url', u.avatar_url
  ) as user_info
FROM session_questions q
LEFT JOIN users u ON u.id = q.user_id;

-- Grant access to the view
GRANT SELECT ON question_display TO public;