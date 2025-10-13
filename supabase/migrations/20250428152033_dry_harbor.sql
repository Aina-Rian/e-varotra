/*
  # Add email column to users table

  1. Changes
    - Drop existing index if it exists
    - Add email column to users table
    - Create unique index on email
    - Update RLS policies
*/

-- Drop existing index if it exists
DROP INDEX IF EXISTS users_email_key;

-- Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Update existing rows to set email from auth.users
UPDATE users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id
AND u.email IS NULL;

-- Now make the column NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX users_email_key ON users(email);

-- Add comment
COMMENT ON COLUMN users.email IS 'User''s email address - must be unique and is used for identification';

-- Update RLS policies
DROP POLICY IF EXISTS "Public can read basic user info" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

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