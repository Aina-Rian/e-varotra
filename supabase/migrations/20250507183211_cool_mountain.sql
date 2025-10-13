/*
  # Add speaker materials RLS policies

  1. Changes
    - Add RLS policies to allow speakers to manage materials for their sessions
    - Add policy for speakers to upload to storage bucket
    - Add policy for speakers to manage session materials

  2. Security
    - Enable RLS on session_materials table
    - Add policies to verify speaker association with session
    - Ensure speakers can only manage their own materials
*/

-- Add policy to allow speakers to manage materials for their sessions
CREATE POLICY "Speakers can manage materials for their sessions"
ON session_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM session_speakers ss
    JOIN speakers s ON s.id = ss.speaker_id
    WHERE ss.session_id = session_materials.session_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM session_speakers ss
    JOIN speakers s ON s.id = ss.speaker_id
    WHERE ss.session_id = session_materials.session_id 
    AND s.user_id = auth.uid()
  )
);

-- Add storage policy for speakers
CREATE POLICY "Speakers can upload session materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'session-materials' AND
  EXISTS (
    SELECT 1 
    FROM session_speakers ss
    JOIN speakers s ON s.id = ss.speaker_id
    WHERE ss.session_id = (SELECT REGEXP_MATCH(path_tokens[1], '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))[1]::uuid
    AND s.user_id = auth.uid()
  )
);

-- Add storage policy for reading materials
CREATE POLICY "Anyone can read session materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'session-materials');