/*
  # Fix speaker access tokens and session speakers creation

  1. Changes
    - Drop and recreate speaker_access_tokens table with proper constraints
    - Update session_speakers handling
    - Fix token generation and linking
*/

-- First drop dependent objects
DROP TRIGGER IF EXISTS session_speaker_link_trigger ON session_speakers;
DROP FUNCTION IF EXISTS handle_session_speaker_link();
DROP TABLE IF EXISTS speaker_access_tokens CASCADE;

-- Recreate speaker_access_tokens table with proper constraints
CREATE TABLE speaker_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  speaker_id uuid NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT speaker_access_tokens_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES sessions(id) 
    ON DELETE CASCADE,
  CONSTRAINT speaker_access_tokens_speaker_id_fkey 
    FOREIGN KEY (speaker_id) 
    REFERENCES speakers(id) 
    ON DELETE CASCADE,
  CONSTRAINT speaker_access_tokens_session_speaker_unique 
    UNIQUE (session_id, speaker_id),
  CONSTRAINT speaker_access_tokens_token_unique 
    UNIQUE (token)
);

-- Enable RLS
ALTER TABLE speaker_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing tokens
CREATE POLICY "Speakers can view their access tokens"
ON speaker_access_tokens
FOR SELECT
TO public
USING (true);

-- Create function to handle session speaker linking
CREATE OR REPLACE FUNCTION handle_session_speaker_link()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  BEGIN
    -- Insert token with error handling
    INSERT INTO speaker_access_tokens (
      session_id,
      speaker_id,
      token
    )
    VALUES (
      NEW.session_id,
      NEW.speaker_id,
      v_token
    )
    ON CONFLICT (session_id, speaker_id) 
    DO UPDATE SET token = v_token;

    -- Update speaker's access link
    UPDATE speakers
    SET access_link = '/speaker-access/session/' || NEW.session_id || '?token=' || v_token
    WHERE id = NEW.speaker_id;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error details
      RAISE NOTICE 'Error in handle_session_speaker_link: %', SQLERRM;
      RETURN NEW;
  END;
END;
$$;

-- Create trigger for session_speakers
CREATE TRIGGER session_speaker_link_trigger
  AFTER INSERT ON session_speakers
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_speaker_link();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS speaker_access_tokens_token_idx 
ON speaker_access_tokens(token);

-- Function to validate speaker access
CREATE OR REPLACE FUNCTION validate_speaker_access(
  p_session_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM speaker_access_tokens
    WHERE session_id = p_session_id
    AND token = p_token
  );
END;
$$;