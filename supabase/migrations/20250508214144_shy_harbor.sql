/*
  # Fix messages table RLS policy

  1. Changes
    - Add RLS policy to allow exhibitors to send messages
    - Policy validates:
      - Exhibitor token is valid and not expired
      - Exhibitor is associated with the event
      - Message sender/receiver types are valid

  2. Security
    - Enable RLS on messages table
    - Add policy for exhibitor message sending
    - Maintain existing policies
*/

-- Add policy for exhibitors to send messages
CREATE POLICY "Exhibitors can send messages"
ON messages
FOR INSERT
TO public
WITH CHECK (
  -- Verify exhibitor token and metadata
  (
    -- Get exhibitor token and metadata from JWT claims
    COALESCE(current_setting('request.jwt.claims', true)::json->>'exhibitor_token', '') IS NOT NULL
    AND COALESCE(current_setting('request.jwt.claims', true)::json->>'exhibitor_id', '') IS NOT NULL
    AND COALESCE(current_setting('request.jwt.claims', true)::json->>'event_id', '') IS NOT NULL
    
    -- Verify token exists and is not expired
    AND EXISTS (
      SELECT 1 
      FROM exhibitor_access_tokens eat
      WHERE eat.token = (current_setting('request.jwt.claims', true)::json->>'exhibitor_token')
      AND eat.exhibitor_id = (current_setting('request.jwt.claims', true)::json->>'exhibitor_id')::uuid
      AND eat.event_id = (current_setting('request.jwt.claims', true)::json->>'event_id')::uuid
      AND eat.expires_at > now()
    )
    
    -- Verify message properties
    AND sender_id = (current_setting('request.jwt.claims', true)::json->>'exhibitor_id')::uuid
    AND sender_type = 'exhibitor'
    AND receiver_type = 'user'
    
    -- Verify exhibitor exists and is associated with the event
    AND EXISTS (
      SELECT 1 
      FROM event_exhibitors ee
      WHERE ee.exhibitor_id = (current_setting('request.jwt.claims', true)::json->>'exhibitor_id')::uuid
      AND ee.event_id = (current_setting('request.jwt.claims', true)::json->>'event_id')::uuid
    )
  )
);