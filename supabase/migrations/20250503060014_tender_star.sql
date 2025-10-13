/*
  # Fix exhibitor products RLS policies

  1. Changes
    - Update RLS policies for exhibitor_products table to allow exhibitors to manage their products
    - Add policy for exhibitors to insert/update/delete their own products
    - Maintain existing policies for organizers and public viewing

  2. Security
    - Exhibitors can only manage products for their own exhibitor profile
    - Event organizers retain full control over all products
    - Public can still view products for published events
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Event organizers can manage all products" ON exhibitor_products;
DROP POLICY IF EXISTS "Exhibitors can manage their own products" ON exhibitor_products;
DROP POLICY IF EXISTS "Public can view products for published events" ON exhibitor_products;

-- Recreate policies with correct permissions
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

CREATE POLICY "Exhibitors can manage their own products"
ON exhibitor_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_products.exhibitor_id
    AND (
      -- Direct user match
      e.user_id = auth.uid()
      OR
      -- Access through exhibitor access token
      EXISTS (
        SELECT 1 FROM exhibitor_access_tokens t
        WHERE t.exhibitor_id = e.id
        AND t.event_id = exhibitor_products.event_id
        AND t.expires_at > now()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_products.exhibitor_id
    AND (
      -- Direct user match
      e.user_id = auth.uid()
      OR
      -- Access through exhibitor access token
      EXISTS (
        SELECT 1 FROM exhibitor_access_tokens t
        WHERE t.exhibitor_id = e.id
        AND t.event_id = exhibitor_products.event_id
        AND t.expires_at > now()
      )
    )
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