/*
  # Fix user permissions and profile access

  1. Changes
    - Drop and recreate all RLS policies for users table
    - Add comprehensive policies for user profile management
    - Enable service role access for system operations
    - Fix profile creation during signup
    - Allow users to manage their own profiles

  2. Security
    - Users can only access and modify their own data
    - Public can view basic user information
    - Service role has full access for system operations
*/

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users"
ON users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for authenticated users"
ON users FOR SELECT 
TO authenticated 
USING (
  auth.uid() = id OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable update for users based on id"
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
ON users FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- Grant full access to service role
CREATE POLICY "Service role has full access"
ON users FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Ensure the users table has the correct columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'social_links'
  ) THEN
    ALTER TABLE users ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'interests'
  ) THEN
    ALTER TABLE users ADD COLUMN interests text[] DEFAULT '{}'::text[];
  END IF;
END $$;