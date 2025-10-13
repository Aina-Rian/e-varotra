/*
  # Add token-based access for exhibitor products

  1. Changes
    - Drop existing policies
    - Add new policy for token-based access
    - Create function to set exhibitor token claim
    - Update existing policies for better security
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Exhibitors can manage their own products" ON exhibitor_products;
DROP POLICY IF EXISTS "Event organizers can manage all products" ON exhibitor_products;
DROP POLICY IF EXISTS "Public can view products for published events" ON exhibitor_products;
DROP POLICY IF EXISTS "Token-based access for exhibitors" ON exhibitor_products;

-- Create updated policies
CREATE POLICY "Exhibitors can manage their own products"
ON exhibitor_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_products.exhibitor_id
    AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_products.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Event organizers can manage all products"
ON exhibitor_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_products.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_products.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Public can view products for published events"
ON exhibitor_products
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_products.event_id
    AND e.status IN ('published', 'live')
  )
);

-- Add policy for token-based access
CREATE POLICY "Token-based access for exhibitors"
ON exhibitor_products
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM exhibitor_access_tokens eat
    WHERE eat.exhibitor_id = exhibitor_products.exhibitor_id
    AND eat.event_id = exhibitor_products.event_id
    AND eat.token = current_setting('request.jwt.claims', true)::json->>'exhibitor_token'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exhibitor_access_tokens eat
    WHERE eat.exhibitor_id = exhibitor_products.exhibitor_id
    AND eat.event_id = exhibitor_products.event_id
    AND eat.token = current_setting('request.jwt.claims', true)::json->>'exhibitor_token'
  )
);

-- Create function to handle exhibitor token authentication
CREATE OR REPLACE FUNCTION set_exhibitor_token_claim(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', 
    jsonb_build_object('exhibitor_token', token)::text,
    true
  );
END;
$$;