/*
  # Update exhibitor products RLS policies

  1. Changes
    - Add RLS policies for exhibitor_products table to allow exhibitors to manage their own products
    - Add policy for event organizers to manage all products in their events
    - Add policy for public to view products in published events

  2. Security
    - Enable RLS on exhibitor_products table
    - Add policies for insert, update, delete operations
*/

-- Enable RLS
ALTER TABLE exhibitor_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Event organizers can manage all products" ON exhibitor_products;
DROP POLICY IF EXISTS "Exhibitors can manage their own products" ON exhibitor_products;
DROP POLICY IF EXISTS "Public can view products for published events" ON exhibitor_products;

-- Create new policies
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