-- First ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Public can view user profiles" ON users;
  DROP POLICY IF EXISTS "Service role has full access" ON users;
  DROP POLICY IF EXISTS "Users can delete own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert profiles" ON users;
  DROP POLICY IF EXISTS "Users can read all profiles" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Update any null email values with a default based on auth.users
UPDATE users u
SET email = (
  SELECT email 
  FROM auth.users au 
  WHERE au.id = u.id
)
WHERE u.email IS NULL;

-- For any remaining null emails, generate a default
UPDATE users
SET email = id || '@user.vibees.app'
WHERE email IS NULL;

-- Now we can safely make email NOT NULL
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Create unique index on email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'users_email_key'
  ) THEN
    CREATE UNIQUE INDEX users_email_key ON users(email);
  END IF;
END $$;

-- Create comprehensive policies for user management
CREATE POLICY "Public can view user profiles"
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

CREATE POLICY "Users can delete own profile"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert profiles"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update events policies to allow organizers to create events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Users can create events'
  ) THEN
    CREATE POLICY "Users can create events"
      ON events
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = organizer_id
      );
  END IF;
END $$;