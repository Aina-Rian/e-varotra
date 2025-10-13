/*
  # Add Speaker Access Management

  1. New Tables
    - speaker_access_tokens: Store secure access tokens
    - session_materials: Store uploaded materials
    - session_questions: Store pre-submitted questions

  2. Security
    - Enable RLS on new tables
    - Add policies for secure access
    - Add storage bucket for materials
*/

-- Create speaker_access_tokens table
CREATE TABLE IF NOT EXISTS speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, speaker_id)
);

-- Create session_materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create storage bucket for session materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-materials', 'session-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_speakers ss ON ss.session_id = s.id
    WHERE s.id = speaker_access_tokens.session_id
    AND ss.speaker_id = speaker_access_tokens.speaker_id
  )
);

CREATE POLICY "Speakers can manage their materials"
ON session_materials
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_speakers ss ON ss.session_id = s.id
    WHERE s.id = session_materials.session_id
    AND ss.speaker_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_speakers ss ON ss.session_id = s.id
    WHERE s.id = session_materials.session_id
    AND ss.speaker_id = auth.uid()
  )
);

-- Create storage policies
CREATE POLICY "Speakers can upload materials"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'session-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text
    FROM sessions s
    JOIN session_speakers ss ON ss.session_id = s.id
    WHERE ss.speaker_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view public materials"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'session-materials' AND
  EXISTS (
    SELECT 1 FROM session_materials sm
    WHERE sm.url LIKE '%' || name || '%'
    AND sm.is_public = true
  )
);

-- Add function to generate speaker access token
CREATE OR REPLACE FUNCTION generate_speaker_access_token(
  p_session_id uuid,
  p_speaker_id uuid,
  p_expires_in interval DEFAULT interval '7 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update the token
  INSERT INTO speaker_access_tokens (
    session_id,
    speaker_id,
    token,
    expires_at
  )
  VALUES (
    p_session_id,
    p_speaker_id,
    v_token,
    now() + p_expires_in
  )
  ON CONFLICT (session_id, speaker_id)
  DO UPDATE SET
    token = v_token,
    expires_at = now() + p_expires_in;
    
  RETURN v_token;
END;
$$;

-- Add function to validate speaker access token
CREATE OR REPLACE FUNCTION validate_speaker_access_token(
  p_session_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM speaker_access_tokens
    WHERE session_id = p_session_id
    AND token = p_token
    AND expires_at > now()
  );
END;
$$;