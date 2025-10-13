/*
  # Add exhibitor access link and token management

  1. Changes
    - Add access_link column to exhibitors table
    - Create exhibitor_access_tokens table
    - Add functions to generate and validate tokens
    - Update exhibitor creation process

  2. Security
    - Enable RLS on new table
    - Add policies for proper access control
    - Ensure secure token generation
*/

-- Add access_link to exhibitors table
ALTER TABLE exhibitors
ADD COLUMN IF NOT EXISTS access_link text;

-- Create exhibitor_access_tokens table
CREATE TABLE IF NOT EXISTS exhibitor_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, exhibitor_id),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE exhibitor_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for token access
CREATE POLICY "Exhibitors can view their access tokens"
ON exhibitor_access_tokens
FOR SELECT
TO public
USING (
  expires_at > now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS exhibitor_access_tokens_token_idx ON exhibitor_access_tokens(token);
CREATE INDEX IF NOT EXISTS exhibitor_access_tokens_expires_at_idx ON exhibitor_access_tokens(expires_at);

-- Update token validation function
CREATE OR REPLACE FUNCTION validate_exhibitor_access(
  p_event_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM exhibitor_access_tokens
    WHERE event_id = p_event_id
    AND token = p_token
    AND expires_at > now()
  );
END;
$$;

-- Update token generation function
CREATE OR REPLACE FUNCTION generate_exhibitor_access_token(
  p_event_id uuid,
  p_exhibitor_id uuid,
  p_expires_in interval DEFAULT interval '30 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(16), 'hex');
  
  -- Insert or update the token
  INSERT INTO exhibitor_access_tokens (
    event_id,
    exhibitor_id,
    token,
    expires_at
  )
  VALUES (
    p_event_id,
    p_exhibitor_id,
    v_token,
    now() + p_expires_in
  )
  ON CONFLICT (event_id, exhibitor_id)
  DO UPDATE SET
    token = v_token,
    expires_at = now() + p_expires_in;
    
  -- Update exhibitor's access link
  UPDATE exhibitors
  SET access_link = '/exhibitor-access/event/' || p_event_id || '?token=' || v_token
  WHERE id = p_exhibitor_id;
  
  RETURN v_token;
END;
$$;

-- Create function to handle exhibitor-event linking
CREATE OR REPLACE FUNCTION handle_event_exhibitor_link()
RETURNS TRIGGER AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate access token
  v_token := generate_exhibitor_access_token(NEW.event_id, NEW.exhibitor_id);
  
  -- Update exhibitor's access link
  UPDATE exhibitors
  SET access_link = '/exhibitor-access/event/' || NEW.event_id || '?token=' || v_token
  WHERE id = NEW.exhibitor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event_exhibitors
DROP TRIGGER IF EXISTS event_exhibitor_link_trigger ON event_exhibitors;
CREATE TRIGGER event_exhibitor_link_trigger
  AFTER INSERT ON event_exhibitors
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_exhibitor_link();

-- Create policy for exhibitor token creation
CREATE POLICY "Anyone can create exhibitor access tokens"
ON exhibitor_access_tokens
FOR INSERT
TO public
WITH CHECK (true);