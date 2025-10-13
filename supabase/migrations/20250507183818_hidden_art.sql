/*
  # Fix Speaker Materials RLS Policies

  1. Changes
    - Add RLS policies for session_materials table to allow speakers with tokens to manage materials
    - Add storage policies for session-materials bucket to allow token-based uploads
    - Create function to validate speaker tokens for storage access

  2. Security
    - Maintain existing security model
    - Allow speakers to upload materials using their access tokens
    - Ensure proper access control
*/

-- Create function to validate speaker token for storage access
CREATE OR REPLACE FUNCTION validate_speaker_token(
  p_session_id uuid,
  p_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM speaker_access_tokens
    WHERE session_id = p_session_id
    AND token = p_token
  );
END;
$$;

-- Drop existing policies for session_materials
DROP POLICY IF EXISTS "Public materials are viewable by everyone" ON session_materials;
DROP POLICY IF EXISTS "Authenticated users can manage materials" ON session_materials;
DROP POLICY IF EXISTS "Speakers can manage materials" ON session_materials;
DROP POLICY IF EXISTS "Speakers can manage materials for their sessions" ON session_materials;

-- Create new policies for session_materials
CREATE POLICY "Public materials are viewable by everyone"
ON session_materials
FOR SELECT
TO public
USING (
  is_public AND
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Speakers can manage materials for their sessions"
ON session_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM session_speakers ss
    JOIN speakers sp ON sp.id = ss.speaker_id
    WHERE ss.session_id = session_materials.session_id
    AND sp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_speakers ss
    JOIN speakers sp ON sp.id = ss.speaker_id
    WHERE ss.session_id = session_materials.session_id
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage session materials"
ON session_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND e.organizer_id = auth.uid()
  )
);

-- Create policy for token-based access
CREATE POLICY "Speaker token access for materials"
ON session_materials
FOR ALL
TO public
USING (
  current_setting('request.jwt.claims', true)::jsonb->>'speaker_token' IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.session_id = session_materials.session_id
    AND sat.token = current_setting('request.jwt.claims', true)::jsonb->>'speaker_token'
  )
)
WITH CHECK (
  current_setting('request.jwt.claims', true)::jsonb->>'speaker_token' IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.session_id = session_materials.session_id
    AND sat.token = current_setting('request.jwt.claims', true)::jsonb->>'speaker_token'
  )
);

-- Create storage bucket for session materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-materials', 'session-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies for session-materials
DROP POLICY IF EXISTS "vibees_session_materials_select" ON storage.objects;
DROP POLICY IF EXISTS "vibees_session_materials_insert" ON storage.objects;
DROP POLICY IF EXISTS "vibees_session_materials_update" ON storage.objects;
DROP POLICY IF EXISTS "vibees_session_materials_delete" ON storage.objects;
DROP POLICY IF EXISTS "Speakers can upload session materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view session materials" ON storage.objects;
DROP POLICY IF EXISTS "Speaker token can upload materials" ON storage.objects;

-- Create new storage policies for session-materials
CREATE POLICY "Anyone can view session materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'session-materials');

CREATE POLICY "Speakers can upload session materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'session-materials' AND
  EXISTS (
    SELECT 1 FROM session_speakers ss
    JOIN speakers sp ON sp.id = ss.speaker_id
    WHERE sp.user_id = auth.uid()
    AND (storage.foldername(name))[1] = ss.session_id::text
  )
);

CREATE POLICY "Speaker token can upload materials"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'session-materials' AND
  current_setting('request.jwt.claims', true)::jsonb->>'speaker_token' IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.token = current_setting('request.jwt.claims', true)::jsonb->>'speaker_token'
    AND sat.session_id::text = (storage.foldername(name))[1]
  )
);

-- Create function to set speaker token claim
CREATE OR REPLACE FUNCTION set_speaker_token_claim(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', 
    jsonb_build_object('speaker_token', token)::text,
    true
  );
END;
$$;

-- Create function to check if a speaker token is valid
CREATE OR REPLACE FUNCTION is_valid_speaker_token(
  p_session_id uuid,
  p_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM speaker_access_tokens
    WHERE session_id = p_session_id
    AND token = p_token
  );
END;
$$;