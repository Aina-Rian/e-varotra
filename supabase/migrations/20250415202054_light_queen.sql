/*
  # Remove token expiration from speaker access system

  1. Changes
    - Remove expires_at column from speaker_access_tokens table
    - Update token validation to not check expiration
    - Add unique constraint on token column
*/

-- Drop and recreate speaker_access_tokens table without expiration
DROP TABLE IF EXISTS speaker_access_tokens CASCADE;

CREATE TABLE speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, speaker_id),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for token access
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS speaker_access_tokens_token_idx ON speaker_access_tokens(token);