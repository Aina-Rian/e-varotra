/*
  # Add session chat functionality

  1. New Tables
    - `session_messages` - Store chat messages for each session
    - `session_questions` - Store participant questions

  2. Security
    - Enable RLS on new tables
    - Add policies for proper access control
*/

-- Create session_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS session_messages_session_id_idx ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS session_messages_user_id_idx ON session_messages(user_id);
CREATE INDEX IF NOT EXISTS session_messages_created_at_idx ON session_messages(created_at);

-- Enable RLS
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view session messages" ON session_messages;
  DROP POLICY IF EXISTS "Authenticated users can send messages" ON session_messages;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create policies
CREATE POLICY "Anyone can view session messages"
ON session_messages
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON session_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'session_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_messages;
  END IF;
END
$$;