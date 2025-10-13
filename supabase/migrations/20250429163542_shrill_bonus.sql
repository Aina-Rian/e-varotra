/*
  # Fix Storage Policies for Event Banners and Exhibitor Materials

  1. Changes
    - Create storage buckets for event banners and exhibitor materials
    - Drop existing policies with IF EXISTS to avoid errors
    - Create new policies with unique names to avoid conflicts
    - Set proper permissions for authenticated users and public access

  2. Security
    - Allow public viewing of uploaded materials
    - Restrict upload/update/delete to authenticated users
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('event-banners', 'event-banners', true),
  ('exhibitor-materials', 'exhibitor-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Event banners policies
  DROP POLICY IF EXISTS "Anyone can view event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Organizers can upload event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Organizers can update their event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Organizers can delete their event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update event banners" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete event banners" ON storage.objects;
  
  -- Exhibitor materials policies
  DROP POLICY IF EXISTS "Anyone can view exhibitor materials" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload exhibitor materials" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update exhibitor materials" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete exhibitor materials" ON storage.objects;
  DROP POLICY IF EXISTS "Exhibitors can upload materials" ON storage.objects;
  DROP POLICY IF EXISTS "Exhibitors can update materials" ON storage.objects;
  DROP POLICY IF EXISTS "Exhibitors can delete materials" ON storage.objects;
END $$;

-- Create storage policies for event banners with unique names
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_event_banners_select'
  ) THEN
    CREATE POLICY "vibees_event_banners_select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_event_banners_insert'
  ) THEN
    CREATE POLICY "vibees_event_banners_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_event_banners_update'
  ) THEN
    CREATE POLICY "vibees_event_banners_update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-banners')
    WITH CHECK (bucket_id = 'event-banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_event_banners_delete'
  ) THEN
    CREATE POLICY "vibees_event_banners_delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'event-banners');
  END IF;
END $$;

-- Create storage policies for exhibitor materials with unique names
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_exhibitor_materials_select'
  ) THEN
    CREATE POLICY "vibees_exhibitor_materials_select"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'exhibitor-materials');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_exhibitor_materials_insert'
  ) THEN
    CREATE POLICY "vibees_exhibitor_materials_insert"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'exhibitor-materials');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_exhibitor_materials_update'
  ) THEN
    CREATE POLICY "vibees_exhibitor_materials_update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'exhibitor-materials')
    WITH CHECK (bucket_id = 'exhibitor-materials');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'vibees_exhibitor_materials_delete'
  ) THEN
    CREATE POLICY "vibees_exhibitor_materials_delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'exhibitor-materials');
  END IF;
END $$;