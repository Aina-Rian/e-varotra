/*
  # Fix exhibitor materials RLS policies

  1. Changes
    - Add token-based access policy for exhibitor_materials table
    - Update existing policies to allow proper access control
    - Add function to validate exhibitor tokens

  2. Security
    - Allow exhibitors to manage their materials with valid token
    - Maintain existing security for organizers and public access
*/

-- First create a function to validate exhibitor token claims if it doesn't exist
CREATE OR REPLACE FUNCTION public.validate_exhibitor_token(
  required_exhibitor_id uuid,
  required_event_id uuid
) RETURNS boolean AS $$
BEGIN
  -- Get the claims from the JWT
  DECLARE
    exhibitor_token text;
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
  DROP POLICY IF EXISTS "Exhibitor materials viewable by everyone" ON exhibitor_materials;
  DROP POLICY IF EXISTS "Exhibitor materials manageable by organizers" ON exhibitor_materials;
  DROP POLICY IF EXISTS "Exhibitor materials manageable by exhibitors" ON exhibitor_materials;
  DROP POLICY IF EXISTS "Token-based access for exhibitor materials" ON exhibitor_materials;
  DROP POLICY IF EXISTS "Debug insert" ON exhibitor_materials;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create new policies for exhibitor_materials table
CREATE POLICY "Exhibitor materials viewable by everyone"
ON exhibitor_materials
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Exhibitor materials manageable by organizers"
ON exhibitor_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor materials manageable by exhibitors"
ON exhibitor_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_materials.exhibitor_id
    AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_materials.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

-- Add policy for token-based access
CREATE POLICY "Token-based access for exhibitor materials"
ON exhibitor_materials
FOR ALL
TO public
USING (
  validate_exhibitor_token(exhibitor_id, event_id)
)
WITH CHECK (
  validate_exhibitor_token(exhibitor_id, event_id)
);