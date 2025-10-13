/*
  # Fix user permissions for speaker creation

  1. Changes
    - Drop existing policies that might conflict
    - Add policies to allow organizers to create and manage users
    - Add policy for public viewing of user profiles
    - Fix permissions for speaker creation process

  2. Security
    - Maintain RLS on users table
    - Allow organizers to create users for speakers
    - Keep existing permissions for user self-management
*/

-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Public can read basic user info" ON users;
  DROP POLICY IF EXISTS "Service role has full access" ON users;
  DROP POLICY IF EXISTS "Users can delete own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can read all profiles" ON users;
  DROP POLICY IF EXISTS "Users can insert profiles" ON users;
  DROP POLICY IF EXISTS "Public can view user profiles" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create comprehensive policies for user management
DO $$ 
BEGIN
  -- Policy for authenticated users to read all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read all profiles'
  ) THEN
    CREATE POLICY "Users can read all profiles"
      ON users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Policy for authenticated users to insert profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can insert profiles'
  ) THEN
    CREATE POLICY "Users can insert profiles"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Policy for users to update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Policy for users to delete their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON users
      FOR DELETE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Policy for service role to have full access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Service role has full access'
  ) THEN
    CREATE POLICY "Service role has full access"
      ON users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Policy for public to view user profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Public can view user profiles'
  ) THEN
    CREATE POLICY "Public can view user profiles"
      ON users
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;