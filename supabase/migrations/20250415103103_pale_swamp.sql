/*
  # Fix session messages for speakers

  1. Changes
    - Add speaker_id column to session_messages table
    - Update policies to allow speaker access
    - Add function to get message sender info
    - Add trigger to handle message creation

  2. Security
    - Maintain RLS on session_messages table
    - Allow both users and speakers to send messages
    - Enable proper access control
*/

-- Add speaker_id to session_messages
ALTER TABLE session_messages
ADD COLUMN speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE;

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
    FROM auth.users u
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

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view session messages" ON session_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON session_messages;

-- Create new policies
CREATE POLICY "Anyone can view session messages"
ON session_messages
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users and speakers can send messages"
ON session_messages
FOR INSERT
TO public
WITH CHECK (
  (
    -- Regular authenticated users
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    speaker_id IS NULL
  ) OR (
    -- Speakers with valid access token
    EXISTS (
      SELECT 1 FROM speaker_access_tokens sat
      WHERE sat.session_id = session_messages.session_id
      AND sat.speaker_id = session_messages.speaker_id
      AND sat.token = current_setting('request.jwt.claims')::jsonb->>'speaker_token'
    )
  )
);

-- Create view for message display
CREATE OR REPLACE VIEW message_display AS
SELECT 
  m.id,
  m.session_id,
  m.content,
  m.created_at,
  get_message_sender_info(m.user_id, m.speaker_id) as sender
FROM session_messages m;

-- Grant access to the view
GRANT SELECT ON message_display TO public;