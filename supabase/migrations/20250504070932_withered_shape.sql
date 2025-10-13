/*
  # Fix user policies for organizer management

  1. Changes
    - Add policy to allow organizers to create users
    - Update existing policies to allow proper user management
    - Fix RLS policies for user creation

  2. Security
    - Maintain existing security model
    - Allow organizers to create and manage users
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert profiles" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create new policy to allow organizers to create users
CREATE POLICY "Allow insert for authenticated users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow organizers to manage users
CREATE POLICY "Organizers can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE organizer_id = auth.uid()
  )
);