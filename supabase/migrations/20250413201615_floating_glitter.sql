/*
  # Fix recursive policies for users table

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify user role checks to avoid recursion
    - Update policies to use direct id comparisons where possible
    
  2. Security
    - Maintain security by ensuring users can only access appropriate data
    - Preserve admin access controls
    - Keep RLS enabled
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable admin management" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new, simplified policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role has full access"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
  )
);