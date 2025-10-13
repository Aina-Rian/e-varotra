/*
  # Update events table RLS policies

  1. Changes
    - Add policy for authenticated users to create events
    - Update public viewing policy to allow viewing all published/live events
    - Add policy for authenticated users to view their own draft events

  2. Security
    - Maintains RLS on events table
    - Ensures only authenticated users can create events
    - Allows public access to published/live events only
    - Restricts draft events to their organizers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can manage their events" ON events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

-- Create new policies
CREATE POLICY "Users can create events"
ON events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = organizer_id
);

CREATE POLICY "Users can manage their own events"
ON events
FOR ALL
TO authenticated
USING (
  auth.uid() = organizer_id
)
WITH CHECK (
  auth.uid() = organizer_id
);

CREATE POLICY "Public can view published events"
ON events
FOR SELECT
TO public
USING (
  status IN ('published', 'live')
);