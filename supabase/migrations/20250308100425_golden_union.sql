/*
  # Create events table and initial data

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `type` (event_type)
      - `status` (event_status)
      - `banner_url` (text, nullable)
      - `logo_url` (text, nullable)
      - `max_attendees` (integer)
      - `current_attendees` (integer)
      - `organizer_id` (uuid)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `events` table
    - Add policies for public read access
    - Add policies for organizer management
*/

-- Create event type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('conference', 'exhibition', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create event status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'ended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  banner_url text,
  logo_url text,
  max_attendees integer NOT NULL DEFAULT 1000,
  current_attendees integer NOT NULL DEFAULT 0,
  organizer_id uuid NOT NULL REFERENCES auth.users(id),
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
  DROP POLICY IF EXISTS "Organizers can manage their events" ON events;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Public events are viewable by everyone"
  ON events
  FOR SELECT
  TO public
  USING (status IN ('published', 'live'));

CREATE POLICY "Organizers can manage their events"
  ON events
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date);
  CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);
  CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);
END $$;

-- Insert sample data only if the table is empty
DO $$ 
DECLARE
  user_id uuid;
BEGIN
  -- Get the first user from auth.users or create a default one
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
    INSERT INTO events (
      title,
      description,
      start_date,
      end_date,
      type,
      status,
      banner_url,
      max_attendees,
      current_attendees,
      organizer_id
    ) VALUES 
    (
      'Tech Innovation Summit 2025',
      'Join industry leaders for a day of cutting-edge technology discussions and networking opportunities.',
      '2025-04-15 09:00:00+00',
      '2025-04-15 17:00:00+00',
      'hybrid',
      'published',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2000',
      500,
      127,
      user_id
    ),
    (
      'Digital Marketing Masterclass',
      'Learn advanced digital marketing strategies from experienced professionals.',
      '2025-05-20 10:00:00+00',
      '2025-05-20 16:00:00+00',
      'conference',
      'published',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000',
      200,
      45,
      user_id
    ),
    (
      'Startup Networking Event',
      'Connect with fellow entrepreneurs and investors in this exclusive networking event.',
      '2025-06-10 18:00:00+00',
      '2025-06-10 21:00:00+00',
      'exhibition',
      'published',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=2000',
      150,
      89,
      user_id
    );
  END IF;
END $$;