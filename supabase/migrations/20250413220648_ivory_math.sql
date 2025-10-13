/*
  # Event Platform Schema

  1. Tables
    - events: Main event information
    - sessions: Event sessions/talks
    - rooms: Virtual rooms for sessions
    - speakers: Speaker profiles
    - session_speakers: Many-to-many relationship between sessions and speakers
    - session_materials: Materials shared in sessions
    - session_registrations: Attendee registrations for sessions
    - session_replays: Recording links for completed sessions

  2. Relationships
    - Each event can have multiple sessions
    - Each session is assigned to a room
    - Sessions can have multiple speakers
    - Attendees can register for multiple sessions
*/

-- Create room_type enum
CREATE TYPE room_type AS ENUM ('presentation', 'workshop', 'networking', 'exhibition');

-- Create session_type enum
CREATE TYPE session_type AS ENUM ('keynote', 'talk', 'workshop', 'panel', 'qa');

-- Create session_status enum
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  type room_type NOT NULL,
  capacity integer NOT NULL DEFAULT 100,
  description text,
  meeting_url text,
  features jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  bio text,
  company text,
  position text,
  photo_url text,
  social_links jsonb DEFAULT '{}',
  topics text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  type session_type NOT NULL,
  status session_status DEFAULT 'scheduled',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_attendees integer NOT NULL DEFAULT 100,
  current_attendees integer DEFAULT 0,
  is_private boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_times CHECK (end_time > start_time)
);

-- Create session_speakers junction table
CREATE TABLE IF NOT EXISTS session_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE,
  role text DEFAULT 'speaker',
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, speaker_id)
);

-- Create session_materials table
CREATE TABLE IF NOT EXISTS session_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_registrations table
CREATE TABLE IF NOT EXISTS session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'registered',
  attended boolean DEFAULT false,
  feedback jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create session_replays table
CREATE TABLE IF NOT EXISTS session_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  recording_url text NOT NULL,
  duration interval,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX rooms_event_id_idx ON rooms(event_id);
CREATE INDEX sessions_event_id_idx ON sessions(event_id);
CREATE INDEX sessions_room_id_idx ON sessions(room_id);
CREATE INDEX sessions_start_time_idx ON sessions(start_time);
CREATE INDEX session_speakers_session_id_idx ON session_speakers(session_id);
CREATE INDEX session_speakers_speaker_id_idx ON session_speakers(speaker_id);
CREATE INDEX session_registrations_session_id_idx ON session_registrations(session_id);
CREATE INDEX session_registrations_user_id_idx ON session_registrations(user_id);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_replays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rooms.event_id
      AND events.status IN ('published', 'live')
    )
  );

CREATE POLICY "Public sessions are viewable by everyone"
  ON sessions FOR SELECT
  USING (
    NOT is_private AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = sessions.event_id
      AND events.status IN ('published', 'live')
    )
  );

CREATE POLICY "Public speaker profiles are viewable by everyone"
  ON speakers FOR SELECT
  USING (true);

CREATE POLICY "Speakers can manage their own profile"
  ON speakers
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public materials are viewable by everyone"
  ON session_materials FOR SELECT
  USING (
    is_public AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_materials.session_id
      AND NOT sessions.is_private
    )
  );

CREATE POLICY "Users can view their registrations"
  ON session_registrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can register for sessions"
  ON session_registrations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_registrations.session_id
      AND sessions.current_attendees < sessions.max_attendees
    )
  );

CREATE POLICY "Public replays are viewable by everyone"
  ON session_replays FOR SELECT
  USING (
    is_public AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_replays.session_id
      AND NOT sessions.is_private
    )
  );

-- Create function to update session attendee count
CREATE OR REPLACE FUNCTION update_session_attendees()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions
    SET current_attendees = current_attendees - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating session attendee count
CREATE TRIGGER update_session_attendees_trigger
AFTER INSERT OR DELETE ON session_registrations
FOR EACH ROW
EXECUTE FUNCTION update_session_attendees();