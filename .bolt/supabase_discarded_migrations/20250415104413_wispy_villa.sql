/*
  # Fix speaker chat and add materials support

  1. Changes
    - Add speaker_id to session_messages table
    - Fix message display view to properly join user data
    - Add materials table and policies
    - Update speaker token validation
*/

-- Add speaker_id to session_messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_messages' 
    AND column_name = 'speaker_id'
  ) THEN
    ALTER TABLE session_messages ADD COLUMN speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies and views
DROP POLICY IF EXISTS "Users and speakers can send messages" ON session_messages;
DROP VIEW IF EXISTS message_display;

-- Create function to validate speaker token
CREATE OR REPLACE FUNCTION validate_speaker_token(session_id uuid, token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM speaker_access_tokens
    WHERE speaker_access_tokens.session_id = $1
    AND speaker_access_tokens.token = $2
  );
END;
$$;

-- Update policy for message sending
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
    -- Speakers with valid token
    speaker_id IS NOT NULL AND
    validate_speaker_token(session_id, current_setting('request.headers')::json->>'speaker-token')
  )
);

-- Create session_materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL,
  file_size bigint,
  file_url text NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for materials
CREATE INDEX IF NOT EXISTS session_materials_session_id_idx ON session_materials(session_id);
CREATE INDEX IF NOT EXISTS session_materials_speaker_id_idx ON session_materials(speaker_id);
CREATE INDEX IF NOT EXISTS session_materials_user_id_idx ON session_materials(user_id);

-- Enable RLS on materials
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for materials
CREATE POLICY "Public materials are viewable by everyone"
ON session_materials
FOR SELECT
TO public
USING (is_public = true);

CREATE POLICY "Speakers can manage their materials"
ON session_materials
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.speaker_id = session_materials.speaker_id
    AND sat.token = current_setting('request.headers')::json->>'speaker-token'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.speaker_id = session_materials.speaker_id
    AND sat.token = current_setting('request.headers')::json->>'speaker-token'
  )
);

-- Create storage bucket for materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-materials', 'session-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can read public materials"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'session-materials' AND
  EXISTS (
    SELECT 1 FROM session_materials sm
    WHERE sm.file_url LIKE '%' || name || '%'
    AND sm.is_public = true
  )
);

CREATE POLICY "Speakers can upload materials"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'session-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text
    FROM sessions s
    JOIN speaker_access_tokens sat ON sat.session_id = s.id
    WHERE sat.token = current_setting('request.headers')::json->>'speaker-token'
  )
);

-- Recreate message display view
CREATE OR REPLACE VIEW message_display AS
SELECT 
  m.id,
  m.session_id,
  m.content,
  m.created_at,
  CASE
    WHEN m.user_id IS NOT NULL THEN
      jsonb_build_object(
        'id', m.user_id,
        'full_name', COALESCE((SELECT email FROM auth.users WHERE id = m.user_id), 'Anonymous'),
        'type', 'user'
      )
    WHEN m.speaker_id IS NOT NULL THEN
      jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
        'type', 'speaker'
      )
    ELSE
      jsonb_build_object(
        'id', NULL,
        'full_name', 'Anonymous',
        'type', 'anonymous'
      )
  END as sender
FROM session_messages m
LEFT JOIN speakers s ON s.id = m.speaker_id;

-- Grant access to the view
GRANT SELECT ON message_display TO public;