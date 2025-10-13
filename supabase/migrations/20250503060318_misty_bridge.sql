/*
  # Fix exhibitor products RLS policies

  1. Changes
    - Add RLS policies for exhibitor products table to allow:
      - Exhibitors to manage their own products
      - Event organizers to manage all products for their events
      - Public to view products for published events

  2. Security
    - Enable RLS on exhibitor_products table
    - Add policies for INSERT, UPDATE, DELETE operations
    - Add policy for SELECT operations
*/

-- Enable RLS
ALTER TABLE exhibitor_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Exhibitors can manage their own products" ON exhibitor_products;
DROP POLICY IF EXISTS "Event organizers can manage all products" ON exhibitor_products;
DROP POLICY IF EXISTS "Public can view products for published events" ON exhibitor_products;

-- Policy for exhibitors to manage their own products
CREATE POLICY "Exhibitors can manage their own products" ON exhibitor_products
AS PERMISSIVE FOR ALL
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

-- Policy for event organizers to manage all products
CREATE POLICY "Event organizers can manage all products" ON exhibitor_products
AS PERMISSIVE FOR ALL
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

-- Policy for public to view products
CREATE POLICY "Public can view products for published events" ON exhibitor_products
AS PERMISSIVE FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_products.event_id
    AND e.status IN ('published', 'live')
  )
);