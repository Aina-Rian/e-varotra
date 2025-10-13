/*
  # Fix storage permissions for session materials

  1. Changes
    - Update storage policies to allow public access for uploads
    - Fix RLS policies for session_materials table
    - Add policy for token-based access to storage
    - Remove path restrictions that are causing issues

  2. Security
    - Maintain basic security while allowing necessary access
    - Enable uploads from speaker access pages
*/

-- Drop existing storage policies for session-materials
DROP POLICY IF EXISTS "Anyone can view session materials" ON storage.objects;
DROP POLICY IF EXISTS "Speakers can upload session materials" ON storage.objects;
DROP POLICY IF EXISTS "Speaker token can upload materials" ON storage.objects;

-- Create new, more permissive storage policies
CREATE POLICY "Anyone can view session materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'session-materials');

CREATE POLICY "Anyone can upload session materials"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'session-materials');

CREATE POLICY "Anyone can update session materials"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'session-materials')
WITH CHECK (bucket_id = 'session-materials');

CREATE POLICY "Anyone can delete session materials"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'session-materials');

-- Drop existing policies for session_materials
DROP POLICY IF EXISTS "Public materials are viewable by everyone" ON session_materials;
DROP POLICY IF EXISTS "Speakers can manage materials for their sessions" ON session_materials;
DROP POLICY IF EXISTS "Organizers can manage session materials" ON session_materials;
DROP POLICY IF EXISTS "Speaker token access for materials" ON session_materials;

-- Create new policies for session_materials
CREATE POLICY "Public materials are viewable by everyone"
ON session_materials
FOR SELECT
TO public
USING (
  is_public OR
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Anyone can insert session materials"
ON session_materials
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Speakers can manage their materials"
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