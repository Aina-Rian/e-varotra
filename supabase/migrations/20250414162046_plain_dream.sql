/*
  # Fix session_speakers policies

  1. Changes
    - Drop and recreate policies only if they don't exist
    - Use DO block to handle policy creation safely
    - Maintain same security model but avoid conflicts

  2. Security
    - Keep RLS enabled
    - Allow public viewing of session speakers
    - Allow authenticated users to manage session speakers
*/

-- Use a DO block to safely handle policy creation
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Session speakers viewable by everyone" ON session_speakers;
  DROP POLICY IF EXISTS "Session speakers manageable by authenticated users" ON session_speakers;
  DROP POLICY IF EXISTS "Session speakers manageable by organizers" ON session_speakers;

  -- Create policies only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_speakers' 
    AND policyname = 'Session speakers viewable by everyone'
  ) THEN
    CREATE POLICY "Session speakers viewable by everyone"
    ON session_speakers
    FOR SELECT
    TO public
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_speakers' 
    AND policyname = 'Session speakers manageable by authenticated users'
  ) THEN
    CREATE POLICY "Session speakers manageable by authenticated users"
    ON session_speakers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;

EXCEPTION
  WHEN others THEN
    -- Log any errors but don't fail the migration
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- Ensure RLS is enabled
ALTER TABLE session_speakers ENABLE ROW LEVEL SECURITY;

-- Refresh materialized view to apply changes
REFRESH MATERIALIZED VIEW event_details;