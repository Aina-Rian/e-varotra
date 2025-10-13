/*
  # Add message capture functionality

  1. Changes
    - Add message_capture_enabled column to sessions table
    - Add captured_messages table for storing captured messages
    - Add policies for message capture access control
*/

-- Add message capture flag to sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS message_capture_enabled boolean DEFAULT false;

-- Create captured messages table
CREATE TABLE IF NOT EXISTS captured_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  captured_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS captured_messages_session_id_idx ON captured_messages(session_id);
CREATE INDEX IF NOT EXISTS captured_messages_user_id_idx ON captured_messages(user_id);
CREATE INDEX IF NOT EXISTS captured_messages_captured_at_idx ON captured_messages(captured_at);

-- Enable RLS
ALTER TABLE captured_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Speakers can view captured messages"
ON captured_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session_speakers ss
    WHERE ss.session_id = captured_messages.session_id
    AND ss.speaker_id = auth.uid()
  )
);

CREATE POLICY "Organizers can view captured messages"
ON captured_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = captured_messages.session_id
    AND e.organizer_id = auth.uid()
  )
);

-- Create function to capture messages
CREATE OR REPLACE FUNCTION capture_session_message()
RETURNS trigger AS $$
BEGIN
  -- Only capture if enabled for the session
  IF EXISTS (
    SELECT 1 FROM sessions
    WHERE id = NEW.session_id
    AND message_capture_enabled = true
  ) THEN
    INSERT INTO captured_messages (
      session_id,
      user_id,
      content,
      metadata
    ) VALUES (
      NEW.session_id,
      NEW.user_id,
      NEW.content,
      jsonb_build_object(
        'original_message_id', NEW.id,
        'captured_from', 'session_messages'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message capture
DROP TRIGGER IF EXISTS capture_message_trigger ON session_messages;
CREATE TRIGGER capture_message_trigger
  AFTER INSERT ON session_messages
  FOR EACH ROW
  EXECUTE FUNCTION capture_session_message();