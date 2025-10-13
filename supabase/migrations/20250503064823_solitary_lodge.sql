-- First create a function to validate exhibitor token claims
CREATE OR REPLACE FUNCTION public.validate_exhibitor_token(
  required_exhibitor_id uuid,
  required_event_id uuid
) RETURNS boolean AS $$
BEGIN
  -- Get the claims from the JWT
  DECLARE
    exhibitor_token text;
    claims jsonb;
  BEGIN
    exhibitor_token := current_setting('request.jwt.claims', true)::jsonb->>'exhibitor_token';
    
    -- Query the exhibitor_access_tokens table to validate the token
    RETURN EXISTS (
      SELECT 1 
      FROM exhibitor_access_tokens eat
      WHERE eat.token = exhibitor_token
        AND eat.exhibitor_id = required_exhibitor_id
        AND eat.event_id = required_event_id
        AND eat.expires_at > now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Exhibitors can manage their products" ON exhibitor_products;
  DROP POLICY IF EXISTS "Public can view products" ON exhibitor_products;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies for exhibitor_products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Exhibitors can manage their products'
  ) THEN
    CREATE POLICY "Exhibitors can manage their products"
    ON exhibitor_products
    FOR ALL
    TO public
    USING (
      validate_exhibitor_token(exhibitor_id, event_id)
    )
    WITH CHECK (
      validate_exhibitor_token(exhibitor_id, event_id)
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Public can view products'
  ) THEN
    CREATE POLICY "Public can view products"
    ON exhibitor_products
    FOR SELECT
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = exhibitor_products.event_id
        AND e.status IN ('published', 'live')
      )
    );
  END IF;
END $$;

-- Create storage policies for exhibitor-materials bucket
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Exhibitors can upload materials" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view materials" ON storage.objects;
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;

  -- Create new policies for storage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Exhibitors can upload materials'
  ) THEN
    CREATE POLICY "Exhibitors can upload materials"
    ON storage.objects
    FOR ALL
    TO public
    USING (
      bucket_id = 'exhibitor-materials'
    )
    WITH CHECK (
      bucket_id = 'exhibitor-materials'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can view materials'
  ) THEN
    CREATE POLICY "Public can view materials"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
      bucket_id = 'exhibitor-materials'
    );
  END IF;
END $$;