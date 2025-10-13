/*
  # Event Platform Schema

  1. Tables
    - events: Main event information
    - conferences: Conference sessions
    - stands: Exhibition stands
    - networking_rooms: Virtual networking spaces
    - users: User profiles

  2. Security
    - RLS enabled on all tables
    - Public read access for published/live events
    - User-specific access controls
*/

-- Drop existing types if they exist
DO $$ BEGIN
    DROP TYPE IF EXISTS event_type CASCADE;
    DROP TYPE IF EXISTS event_status CASCADE;
    DROP TYPE IF EXISTS conference_type CASCADE;
    DROP TYPE IF EXISTS conference_status CASCADE;
    DROP TYPE IF EXISTS stand_type CASCADE;
    DROP TYPE IF EXISTS user_role CASCADE;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create event type enums
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('conference', 'exhibition', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conference_type AS ENUM ('keynote', 'panel', 'workshop', 'presentation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conference_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stand_type AS ENUM ('basic', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('attendee', 'exhibitor', 'speaker', 'organizer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS networking_rooms CASCADE;
DROP TABLE IF EXISTS stands CASCADE;
DROP TABLE IF EXISTS conferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Create events table
CREATE TABLE events (
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
    organizer_id uuid NOT NULL,
    settings jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create conferences table
CREATE TABLE conferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    speaker_ids uuid[] NOT NULL DEFAULT '{}',
    type conference_type NOT NULL,
    status conference_status NOT NULL DEFAULT 'scheduled',
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    stream_url text,
    recording_url text,
    materials_url text[] DEFAULT '{}',
    max_attendees integer NOT NULL DEFAULT 500,
    current_attendees integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create stands table
CREATE TABLE stands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    description text NOT NULL,
    type stand_type NOT NULL DEFAULT 'basic',
    banner_url text,
    logo_url text,
    video_url text,
    brochure_urls text[] DEFAULT '{}',
    website_url text,
    contact_email text NOT NULL,
    staff_ids uuid[] NOT NULL DEFAULT '{}',
    custom_theme jsonb,
    analytics jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create networking rooms table
CREATE TABLE networking_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL,
    max_participants integer NOT NULL DEFAULT 50,
    current_participants integer NOT NULL DEFAULT 0,
    topic_tags text[] NOT NULL DEFAULT '{}',
    is_private boolean NOT NULL DEFAULT false,
    scheduled_start timestamptz,
    scheduled_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create users table
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name text NOT NULL,
    company text,
    position text,
    bio text,
    avatar_url text,
    role user_role NOT NULL DEFAULT 'attendee',
    interests text[] DEFAULT '{}',
    social_links jsonb DEFAULT '{}',
    settings jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX conferences_event_id_idx ON conferences(event_id);
CREATE INDEX conferences_start_time_idx ON conferences(start_time);
CREATE INDEX stands_event_id_idx ON stands(event_id);
CREATE INDEX networking_rooms_event_id_idx ON networking_rooms(event_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public events are viewable by everyone" 
ON events FOR SELECT 
USING (status IN ('published', 'live'));

CREATE POLICY "Organizers can manage their events" 
ON events FOR ALL 
USING (organizer_id = auth.uid());

CREATE POLICY "Public conferences are viewable by everyone" 
ON conferences FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = conferences.event_id 
    AND events.status IN ('published', 'live')
));

CREATE POLICY "Public stands are viewable by everyone" 
ON stands FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = stands.event_id 
    AND events.status IN ('published', 'live')
));

CREATE POLICY "Users can view public networking rooms" 
ON networking_rooms FOR SELECT 
USING (
    NOT is_private 
    AND EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = networking_rooms.event_id 
        AND events.status IN ('published', 'live')
    )
);

CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);