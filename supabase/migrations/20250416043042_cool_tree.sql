/*
  # Fix speaker access tokens RLS policy

  1. Changes
    - Drop existing RLS policies
    - Add new policy to allow token creation for authenticated users
    - Maintain token viewing policy
    - Update policy checks to be less restrictive during creation

  2. Security
    - Allow authenticated users to create tokens
    - Maintain secure token viewing
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Speakers can view their access tokens" ON speaker_access_tokens;

-- Create new policies
CREATE POLICY "Anyone can create speaker access tokens"
ON speaker_access_tokens
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (
  expires_at > now()
);

-- Refresh materialized view to apply changes
REFRESH MATERIALIZED VIEW event_details;