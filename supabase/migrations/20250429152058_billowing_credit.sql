-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('event-banners', 'event-banners', true),
  ('exhibitor-materials', 'exhibitor-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies with existence checks
DO $$ 
BEGIN
  -- Check and create policy for viewing event banners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view event banners'
  ) THEN
    CREATE POLICY "Anyone can view event banners"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'event-banners');
  END IF;

  -- Check and create policy for uploading event banners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Organizers can upload event banners'
  ) THEN
    CREATE POLICY "Organizers can upload event banners"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-banners');
  END IF;

  -- Check and create policy for updating event banners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Organizers can update their event banners'
  ) THEN
    CREATE POLICY "Organizers can update their event banners"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-banners')
    WITH CHECK (bucket_id = 'event-banners');
  END IF;

  -- Check and create policy for viewing exhibitor materials
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Anyone can view exhibitor materials'
  ) THEN
    CREATE POLICY "Anyone can view exhibitor materials"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'exhibitor-materials');
  END IF;

  -- Check and create policy for uploading exhibitor materials
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload exhibitor materials'
  ) THEN
    CREATE POLICY "Authenticated users can upload exhibitor materials"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'exhibitor-materials');
  END IF;

  -- Check and create policy for updating exhibitor materials
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can update exhibitor materials'
  ) THEN
    CREATE POLICY "Authenticated users can update exhibitor materials"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'exhibitor-materials')
    WITH CHECK (bucket_id = 'exhibitor-materials');
  END IF;
END $$;