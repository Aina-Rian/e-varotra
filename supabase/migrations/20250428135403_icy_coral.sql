-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view session messages" ON session_messages;
DROP POLICY IF EXISTS "Users can send messages" ON session_messages;

-- Create session_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT sender_check CHECK (
    (user_id IS NOT NULL AND speaker_id IS NULL) OR
    (user_id IS NULL AND speaker_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS session_messages_session_id_idx ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS session_messages_user_id_idx ON session_messages(user_id);
CREATE INDEX IF NOT EXISTS session_messages_speaker_id_idx ON session_messages(speaker_id);
CREATE INDEX IF NOT EXISTS session_messages_created_at_idx ON session_messages(created_at);

-- Enable RLS
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Create function to get message sender info
CREATE OR REPLACE FUNCTION get_message_sender_info(
  p_user_id uuid,
  p_speaker_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'full_name', u.full_name,
      'type', 'user'
    )
    INTO v_result
    FROM users u
    WHERE u.id = p_user_id;
  ELSIF p_speaker_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', s.id,
      'full_name', s.full_name,
      'type', 'speaker'
    )
    INTO v_result
    FROM speakers s
    WHERE s.id = p_speaker_id;
  END IF;

  RETURN COALESCE(v_result, jsonb_build_object(
    'id', NULL,
    'full_name', 'Anonymous',
    'type', 'anonymous'
  ));
END;
$$;

-- Create view for message display
CREATE OR REPLACE VIEW message_display AS
SELECT 
  m.id,
  m.session_id,
  m.content,
  m.created_at,
  get_message_sender_info(m.user_id, m.speaker_id) as sender
FROM session_messages m;

-- Create policies
CREATE POLICY "Anyone can view session messages"
ON session_messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Users can send messages"
ON session_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  speaker_id IS NULL AND
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_messages.session_id
    AND e.status IN ('published', 'live')
  )
);

-- Enable realtime only if not already enabled
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

-- Grant access to the view
GRANT SELECT ON message_display TO public;