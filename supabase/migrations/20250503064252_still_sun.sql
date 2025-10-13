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

-- Create exhibitor_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS exhibitor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price text,
  category text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS exhibitor_products_exhibitor_id_idx ON exhibitor_products(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_products_event_id_idx ON exhibitor_products(event_id);

-- Enable RLS
ALTER TABLE exhibitor_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies one by one with error handling
  BEGIN
    DROP POLICY IF EXISTS "Exhibitors can manage their products" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Public can view products" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Event organizers can manage all products" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Exhibitors can manage their own products" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Token-based access for exhibitors" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Public can view products for published events" ON exhibitor_products;
  EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Create new policies for exhibitor_products table with IF NOT EXISTS
DO $$ 
BEGIN
  -- Policy for public to view products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Public can view products for published events'
  ) THEN
    CREATE POLICY "Public can view products for published events"
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

  -- Policy for exhibitors to manage their own products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Exhibitors can manage their own products'
  ) THEN
    CREATE POLICY "Exhibitors can manage their own products"
    ON exhibitor_products
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM exhibitors e
        WHERE e.id = exhibitor_products.exhibitor_id
        AND e.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM exhibitors e
        WHERE e.id = exhibitor_products.exhibitor_id
        AND e.user_id = auth.uid()
      )
    );
  END IF;

  -- Policy for event organizers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Event organizers can manage all products'
  ) THEN
    CREATE POLICY "Event organizers can manage all products"
    ON exhibitor_products
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = exhibitor_products.event_id
        AND e.organizer_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = exhibitor_products.event_id
        AND e.organizer_id = auth.uid()
      )
    );
  END IF;

  -- Policy for token-based access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exhibitor_products' 
    AND policyname = 'Token-based access for exhibitors'
  ) THEN
    CREATE POLICY "Token-based access for exhibitors"
    ON exhibitor_products
    FOR ALL
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM exhibitor_access_tokens eat
        WHERE eat.exhibitor_id = exhibitor_products.exhibitor_id
        AND eat.event_id = exhibitor_products.event_id
        AND eat.token = (current_setting('request.jwt.claims', true)::json->>'exhibitor_token')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM exhibitor_access_tokens eat
        WHERE eat.exhibitor_id = exhibitor_products.exhibitor_id
        AND eat.event_id = exhibitor_products.event_id
        AND eat.token = (current_setting('request.jwt.claims', true)::json->>'exhibitor_token')
      )
    );
  END IF;
END $$;

-- Create storage bucket for exhibitor products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-materials', 'exhibitor-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DO $$ 
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Exhibitors can upload materials" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Public can view materials" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Token-based access for exhibitor materials" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Public can view exhibitor materials" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN END;
  
  BEGIN
    DROP POLICY IF EXISTS "Authenticated exhibitors can manage materials" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN END;
END $$;

-- Create new policies for storage with IF NOT EXISTS
DO $$ 
BEGIN
  -- Policy for public to view materials
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can view exhibitor materials'
  ) THEN
    CREATE POLICY "Public can view exhibitor materials"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'exhibitor-materials');
  END IF;

  -- Policy for authenticated exhibitors
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated exhibitors can manage materials'
  ) THEN
    CREATE POLICY "Authenticated exhibitors can manage materials"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'exhibitor-materials' AND
      EXISTS (
        SELECT 1
        FROM exhibitors e
        WHERE e.user_id = auth.uid()
      )
    )
    WITH CHECK (
      bucket_id = 'exhibitor-materials' AND
      EXISTS (
        SELECT 1
        FROM exhibitors e
        WHERE e.user_id = auth.uid()
      )
    );
  END IF;

  -- Policy for token-based access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Token-based access for exhibitor materials'
  ) THEN
    CREATE POLICY "Token-based access for exhibitor materials"
    ON storage.objects
    FOR ALL
    TO public
    USING (
      bucket_id = 'exhibitor-materials' AND
      current_setting('request.jwt.claims', true)::json->>'exhibitor_token' IS NOT NULL
    )
    WITH CHECK (
      bucket_id = 'exhibitor-materials' AND
      current_setting('request.jwt.claims', true)::json->>'exhibitor_token' IS NOT NULL
    );
  END IF;
END $$;