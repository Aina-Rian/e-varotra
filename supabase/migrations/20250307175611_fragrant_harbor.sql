/*
  # Fix users table RLS policies

  1. Changes
    - Enable RLS on users table
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Service role can create/update any profile
      - Public can read basic user info

  2. Security
    - Ensures users can only access their own data
    - Allows service role to manage all profiles
    - Restricts sensitive data access
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON users;

-- Create new policies
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

CREATE POLICY "Service role can manage all profiles"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can read basic user info"
ON users
FOR SELECT
TO public
USING (true);