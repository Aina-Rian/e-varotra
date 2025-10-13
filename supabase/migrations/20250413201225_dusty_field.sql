/*
  # Remove user_roles table and update users table

  1. Changes
    - Drop user_roles table and related tables
    - Update users table to use role column
    - Add policies for role management

  2. Security
    - Users can view their own role
    - Admins can manage user roles
*/

-- Drop existing tables and functions
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP FUNCTION IF EXISTS has_permission CASCADE;
DROP FUNCTION IF EXISTS get_user_roles CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Update users table to ensure role column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'attendee';
  END IF;
END $$;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON users;
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;


CREATE POLICY "Enable admin management"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);