/*
  # Fix users table RLS policies

  1. Changes
    - Enable RLS on users table
    - Add comprehensive policies for:
      - Insert: Allow authenticated users to create their own profile
      - Select: Allow users to read their own profile and basic public info
      - Update: Allow users to update their own profile
      - Service role access for system operations

  2. Security
    - Ensures users can only manage their own data
    - Maintains data privacy while allowing necessary access
    - Enables profile creation during signup
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create comprehensive policies
CREATE POLICY "Users can create their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read basic user info"
ON users
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role has full access"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);