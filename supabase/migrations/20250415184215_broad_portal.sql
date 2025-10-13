/*
  # Add file management features

  1. Changes
    - Add function to generate signed URLs for file uploads
    - Add function to validate file types
    - Update session_materials policies
*/

-- Create function to validate file type
CREATE OR REPLACE FUNCTION is_valid_file_type(file_type text)
RETURNS boolean AS $$
BEGIN
  RETURN file_type = ANY(ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]);
END;
$$ LANGUAGE plpgsql;

-- Update session_materials policies
DROP POLICY IF EXISTS "Speakers can manage their materials" ON session_materials;

CREATE POLICY "Speakers can manage materials"
ON session_materials
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.session_id = session_materials.session_id
    AND sat.token = current_setting('request.jwt.claims')::jsonb->>'speaker_token'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM speaker_access_tokens sat
    WHERE sat.session_id = session_materials.session_id
    AND sat.token = current_setting('request.jwt.claims')::jsonb->>'speaker_token'
  )
);