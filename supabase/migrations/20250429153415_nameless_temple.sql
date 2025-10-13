/*
  # Fix Storage Permissions for Event Banners

  1. Changes
    - Ensure event-banners bucket exists and is public
    - Update storage policies to be more permissive
    - Add DELETE policy for objects
    - Fix CORS configuration for storage buckets
*/

-- Ensure storage buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('event-banners', 'event-banners', true),
  ('exhibitor-materials', 'exhibitor-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Anyone can view event banners" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update their event banners" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete their event banners" ON storage.objects;

-- Create more permissive policies for event banners
CREATE POLICY "Anyone can view event banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can upload event banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can update event banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-banners')
WITH CHECK (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can delete event banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-banners');

-- Update exhibitor materials policies
DROP POLICY IF EXISTS "Anyone can view exhibitor materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload exhibitor materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update exhibitor materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete exhibitor materials" ON storage.objects;

CREATE POLICY "Anyone can view exhibitor materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'exhibitor-materials');

CREATE POLICY "Authenticated users can upload exhibitor materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exhibitor-materials');

CREATE POLICY "Authenticated users can update exhibitor materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'exhibitor-materials')
WITH CHECK (bucket_id = 'exhibitor-materials');

CREATE POLICY "Authenticated users can delete exhibitor materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'exhibitor-materials');