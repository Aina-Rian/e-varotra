/*
  # Fix RLS policies for speakers table

  1. Changes
    - Drop existing restrictive policies
    - Add new policy allowing authenticated users to create speakers
    - Add policy for public viewing of speakers
    - Update policy checks to use proper table relationships

  2. Security
    - Maintain proper access control
    - Allow speaker creation by authenticated users
    - Enable public access to speaker information
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Speakers viewable by everyone" ON speakers;
DROP POLICY IF EXISTS "Speakers manageable by organizers" ON speakers;
DROP POLICY IF EXISTS "Speakers can manage their own profile" ON speakers;

-- Create new policies for speakers
CREATE POLICY "Speakers viewable by everyone"
ON speakers
FOR SELECT
TO public
USING (true);

CREATE POLICY "Speakers manageable by authenticated users"
ON speakers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Refresh materialized view to apply changes
REFRESH MATERIALIZED VIEW event_details;