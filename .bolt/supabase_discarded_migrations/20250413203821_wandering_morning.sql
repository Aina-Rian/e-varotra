/*
  # Fix User Policies and Role Management

  1. Changes
    - Drop all existing user policies
    - Create new non-recursive policies
    - Fix role-based access control
    - Enable public read access for basic user info

  2. Security
    - Prevent infinite recursion in policies
    - Maintain proper access control
    - Ensure admin privileges
*/

-- Drop all existing policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can delete own profile" ON users;
  DROP POLICY IF EXISTS "Service role has full access" ON users;
  DROP POLICY IF EXISTS "Public can read basic user info" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies without recursion
CREATE POLICY "Public can read basic user info"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Create admin policy without recursion
CREATE POLICY "Admin access"
ON users FOR ALL
TO authenticated
USING (
  CASE 
    WHEN auth.uid() = id THEN true
    WHEN role = 'admin' THEN true
    ELSE false
  END
)
WITH CHECK (
  CASE 
    WHEN auth.uid() = id THEN true
    WHEN role = 'admin' THEN true
    ELSE false
  END
);

-- Service role policy
CREATE POLICY "Service role has full access"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);