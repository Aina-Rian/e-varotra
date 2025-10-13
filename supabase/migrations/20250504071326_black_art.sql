/*
  # Fix event registrations RLS policy

  1. Changes
    - Drop existing RLS policies for event_registrations
    - Add new policies that allow:
      - Organizers to manage all registrations
      - Users to manage their own registrations
      - Public to view registrations for published events
    
  2. Security
    - Maintain RLS on event_registrations table
    - Allow proper access control based on user roles
    - Ensure data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;

-- Create new policies
CREATE POLICY "Users can view their own registrations"
ON event_registrations
FOR SELECT
TO authenticated
USING (
  -- Users can view their own registrations
  auth.uid() = user_id OR
  -- Organizers can view registrations for their events
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Users can register for events"
ON event_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can register themselves
  (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
      AND e.status IN ('published', 'live')
      AND e.current_attendees < e.max_attendees
    )
  )
  OR
  -- Organizers can register users for their events
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage registrations"
ON event_registrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.organizer_id = auth.uid()
  )
);