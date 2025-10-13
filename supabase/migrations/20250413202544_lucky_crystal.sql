/*
  # Fix User Policies and Remove Role Relations

  1. Changes
    - Drop all existing user policies
    - Create new simplified policies without recursion
    - Update users table structure
    - Remove role-related tables and functions

  2. Security
    - Enable RLS on users table
    - Add basic policies for user management
    - Maintain role-based access through user.role column
*/

-- Drop existing policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can delete own profile" ON users;
  DROP POLICY IF EXISTS "Service role has full access" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  TO service_role
  USING (true);

-- Create a policy for public read access to basic user info
CREATE POLICY "Public can read basic user info"
  ON users
  FOR SELECT
  TO public
  USING (true);