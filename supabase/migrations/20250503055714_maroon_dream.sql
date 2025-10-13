-- Create exhibitor_products table
CREATE TABLE IF NOT EXISTS exhibitor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price text,
  category text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
  -- Removed duplicate foreign key constraints
);

-- Create indexes
CREATE INDEX IF NOT EXISTS exhibitor_products_exhibitor_id_idx ON exhibitor_products(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_products_event_id_idx ON exhibitor_products(event_id);

-- Enable RLS
ALTER TABLE exhibitor_products ENABLE ROW LEVEL SECURITY;

-- Policies for exhibitor_products
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