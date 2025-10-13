/*
  # Add event_moderators table for moderator assignments

  1. New Table
    - `event_moderators`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `event_moderators` table
    - Add policies for proper access control
*/

-- Create event_moderators table
CREATE TABLE IF NOT EXISTS event_moderators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS event_moderators_event_id_idx ON event_moderators(event_id);
CREATE INDEX IF NOT EXISTS event_moderators_user_id_idx ON event_moderators(user_id);

-- Enable RLS
ALTER TABLE event_moderators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organizers can manage event moderators"
ON event_moderators
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_moderators.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_moderators.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Moderators can view their assignments"
ON event_moderators
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Insert sample data if needed
DO $$ 
BEGIN
  -- Check if there are any moderators
  IF EXISTS (
    SELECT 1 FROM users WHERE role = 'moderator' LIMIT 1
  ) THEN
    -- Get a moderator
    DECLARE
      v_moderator_id uuid;
    BEGIN
      SELECT id INTO v_moderator_id FROM users WHERE role = 'moderator' LIMIT 1;
      
      -- Assign this moderator to all events
      INSERT INTO event_moderators (event_id, user_id)
      SELECT id, v_moderator_id FROM events
      ON CONFLICT (event_id, user_id) DO NOTHING;
    END;
  END IF;
END $$;