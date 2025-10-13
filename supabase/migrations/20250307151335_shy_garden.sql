/*
  # Create events table and policies

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `image_url` (text)
      - `type` (text)
      - `status` (text)
      - `capacity` (integer)
      - `registered_count` (integer)
      - `early_bird_deadline` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `events` table
    - Add policies for public read access
*/

CREATE TYPE event_type AS ENUM ('online', 'hybrid', 'physical');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'past');

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  image_url text NOT NULL,
  type event_type NOT NULL,
  status event_status NOT NULL DEFAULT 'upcoming',
  capacity integer NOT NULL CHECK (capacity > 0),
  registered_count integer NOT NULL DEFAULT 0,
  early_bird_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Events are viewable by everyone"
  ON events
  FOR SELECT
  TO public
  USING (true);

-- Insert sample events
INSERT INTO events (title, description, start_date, end_date, image_url, type, status, capacity, registered_count, early_bird_deadline)
VALUES
  (
    'Tech Innovation Summit 2025',
    'Join industry leaders for a day of cutting-edge technology discussions and networking opportunities.',
    '2025-04-15T09:00:00Z',
    '2025-04-15T17:00:00Z',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    'hybrid',
    'upcoming',
    500,
    127,
    '2025-03-15T23:59:59Z'
  ),
  (
    'Digital Marketing Masterclass',
    'Learn advanced digital marketing strategies from experienced professionals.',
    '2025-05-20T10:00:00Z',
    '2025-05-20T16:00:00Z',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000',
    'online',
    'upcoming',
    200,
    45,
    NULL
  ),
  (
    'Startup Networking Event',
    'Connect with fellow entrepreneurs and investors in this exclusive networking event.',
    '2025-06-10T18:00:00Z',
    '2025-06-10T21:00:00Z',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000',
    'physical',
    'upcoming',
    150,
    89,
    NULL
  );