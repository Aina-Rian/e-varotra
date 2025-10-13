/*
  # Add session materials storage bucket and policies

  1. Changes
    - Create storage bucket for session materials
    - Add policies for uploading and viewing materials
    - Update session_materials table policies

  2. Security
    - Allow authenticated users to upload materials
    - Allow public access to view materials
    - Ensure proper access control
*/

-- Create storage bucket for session materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-materials', 'session-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Session materials policies
  DROP POLICY IF EXISTS "Public materials are viewable by everyone" ON session_materials;
  DROP POLICY IF EXISTS "Speakers can manage their materials" ON session_materials;
  
  -- Storage policies
  DROP POLICY IF EXISTS "vibees_session_materials_select" ON storage.objects;
  DROP POLICY IF EXISTS "vibees_session_materials_insert" ON storage.objects;
  DROP POLICY IF EXISTS "vibees_session_materials_update" ON storage.objects;
  DROP POLICY IF EXISTS "vibees_session_materials_delete" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create policies for session_materials table
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

CREATE POLICY "Authenticated users can manage materials"
ON session_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND (
      e.organizer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM session_speakers ss
        WHERE ss.session_id = s.id
        AND EXISTS (
          SELECT 1 FROM speakers sp
          WHERE sp.id = ss.speaker_id
          AND sp.user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.id = session_materials.session_id
    AND (
      e.organizer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM session_speakers ss
        WHERE ss.session_id = s.id
        AND EXISTS (
          SELECT 1 FROM speakers sp
          WHERE sp.id = ss.speaker_id
          AND sp.user_id = auth.uid()
        )
      )
    )
  )
);

-- Create storage policies for session-materials bucket
CREATE POLICY "vibees_session_materials_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'session-materials');

CREATE POLICY "vibees_session_materials_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-materials');

CREATE POLICY "vibees_session_materials_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'session-materials')
WITH CHECK (bucket_id = 'session-materials');

CREATE POLICY "vibees_session_materials_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'session-materials');