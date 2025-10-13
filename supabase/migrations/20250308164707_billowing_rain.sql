/*
  # Add Event Questions and Registrations Tables

  1. New Tables
    - `event_questions`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references users)
      - `question` (text)
      - `status` (enum: pending, answered)
      - `answer` (text, nullable)
      - `answered_at` (timestamp, nullable)
      - `created_at` (timestamp)
    
    - `event_registrations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references users)
      - `status` (enum: registered, attended, cancelled)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

-- Create event_questions table
CREATE TYPE question_status AS ENUM ('pending', 'answered');

CREATE TABLE IF NOT EXISTS event_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  status question_status DEFAULT 'pending' NOT NULL,
  answer text,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create event_registrations table
CREATE TYPE registration_status AS ENUM ('registered', 'attended', 'cancelled');

CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status registration_status DEFAULT 'registered' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for event_questions
CREATE POLICY "Users can view questions for public events"
  ON event_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_questions.event_id
      AND events.status IN ('published', 'live')
    )
  );

CREATE POLICY "Users can create questions for events"
  ON event_questions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_questions.event_id
      AND events.status IN ('published', 'live')
    )
  );

-- Policies for event_registrations
CREATE POLICY "Users can view their own registrations"
  ON event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON event_registrations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.status IN ('published', 'live')
      AND events.current_attendees < events.max_attendees
    )
  );

-- Create indexes
CREATE INDEX event_questions_event_id_idx ON event_questions(event_id);
CREATE INDEX event_questions_user_id_idx ON event_questions(user_id);
CREATE INDEX event_questions_status_idx ON event_questions(status);
CREATE INDEX event_registrations_event_id_idx ON event_registrations(event_id);
CREATE INDEX event_registrations_user_id_idx ON event_registrations(user_id);
CREATE INDEX event_registrations_status_idx ON event_registrations(status);

-- Function to update event attendee count
CREATE OR REPLACE FUNCTION update_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
    UPDATE events
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
    UPDATE events
    SET current_attendees = current_attendees - 1
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating attendee count
CREATE TRIGGER update_event_attendees_trigger
AFTER INSERT OR UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_attendees();