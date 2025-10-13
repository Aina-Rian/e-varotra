/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Add new policies for user management
    - Allow authenticated users to create users
    - Fix speaker registration flow
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Create new policies
CREATE POLICY "Service role has full access"
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

CREATE POLICY "Users can delete own profile"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to create their own profile
  auth.uid() = id OR
  -- Allow creation during speaker registration
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_user_meta_data->>'role' = 'admin' OR
      au.raw_user_meta_data->>'role' = 'organizer'
    )
  )
);

-- Ensure email column exists and is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    CREATE UNIQUE INDEX users_email_key ON users(email);
  END IF;
END $$;