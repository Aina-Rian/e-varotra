/*
  # Fix Events Schema and Add Initial Data

  1. Schema Updates
    - Add missing columns to events table
    - Add proper indexes for performance
    - Enable RLS policies

  2. Security
    - Enable RLS on events table
    - Add policies for public access and organizer management

  3. Initial Data
    - Add sample events for testing
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure events table exists with all required columns
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  type event_type NOT NULL,
  status event_status DEFAULT 'draft',
  banner_url text,
  logo_url text,
  max_attendees integer DEFAULT 1000,
  current_attendees integer DEFAULT 0,
  organizer_id uuid REFERENCES auth.users(id),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Organizers can manage their events" ON events;

-- Create policies
CREATE POLICY "Public events are viewable by everyone"
  ON events
  FOR SELECT
  USING (status IN ('published', 'live'));

CREATE POLICY "Organizers can manage their events"
  ON events
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Insert sample events if none exist
DO $$
BEGIN
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
      'conference',
      'published',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
      500,
      127,
      auth.uid()
    ),
    (
      'Digital Marketing Masterclass',
      'Learn advanced digital marketing strategies from experienced professionals.',
      '2025-05-20 10:00:00+00',
      '2025-05-20 16:00:00+00',
      'conference',
      'published',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000',
      200,
      45,
      auth.uid()
    ),
    (
      'Startup Networking Event',
      'Connect with fellow entrepreneurs and investors in this exclusive networking event.',
      '2025-06-10 18:00:00+00',
      '2025-06-10 21:00:00+00',
      'exhibition',
      'published',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000',
      150,
      89,
      auth.uid()
    );
  END IF;
END $$;