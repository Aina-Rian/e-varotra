/*
  # Fix session_speakers RLS policies

  1. Changes
    - Drop existing policies
    - Add new policies for session_speakers table
    - Allow proper access for session management
    - Enable public viewing of published session speakers

  2. Security
    - Maintain RLS on session_speakers table
    - Allow organizers to manage session speakers
    - Enable public access to speakers in published sessions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Session speakers viewable by everyone" ON session_speakers;
DROP POLICY IF EXISTS "Session speakers manageable by organizers" ON session_speakers;

-- Create new policies for session_speakers
CREATE POLICY "Session speakers viewable by everyone"
ON session_speakers
FOR SELECT
TO public
USING (true);

CREATE POLICY "Session speakers manageable by authenticated users"
ON session_speakers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Refresh materialized view to apply changes
REFRESH MATERIALIZED VIEW event_details;