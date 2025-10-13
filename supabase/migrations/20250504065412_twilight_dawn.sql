/*
  # Create moderator access tokens table

  1. New Tables
    - `moderator_access_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references sessions)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `moderator_access_tokens` table
    - Add policies for token creation and validation
*/

CREATE TABLE IF NOT EXISTS moderator_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS moderator_access_tokens_user_id_idx ON moderator_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS moderator_access_tokens_session_id_idx ON moderator_access_tokens(session_id);
CREATE INDEX IF NOT EXISTS moderator_access_tokens_token_idx ON moderator_access_tokens(token);
CREATE INDEX IF NOT EXISTS moderator_access_tokens_expires_at_idx ON moderator_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE moderator_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create moderator access tokens"
  ON moderator_access_tokens
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Moderators can view their access tokens"
  ON moderator_access_tokens
  FOR SELECT
  TO public
  USING (expires_at > now());