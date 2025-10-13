/*
  # Fix messages table RLS policy

  1. Changes
    - Drop existing policies for messages table
    - Add new policy to allow anyone to insert messages
    - Maintain existing policies for viewing messages

  2. Security
    - Allow public access for message insertion
    - Maintain proper access control for message viewing
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages" ON messages;
  DROP POLICY IF EXISTS "Exhibitors can send messages" ON messages;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create new policies for messages table
CREATE POLICY "Users can view their own messages"
ON messages
FOR SELECT
TO authenticated
USING (
  -- User is sender
  (sender_type = 'user' AND sender_id = auth.uid()) OR
  -- User is receiver
  (receiver_type = 'user' AND receiver_id = auth.uid()) OR
  -- User is exhibitor's user
  (
    (sender_type = 'exhibitor' AND EXISTS (
      SELECT 1 FROM exhibitors
      WHERE id = sender_id AND user_id = auth.uid()
    )) OR
    (receiver_type = 'exhibitor' AND EXISTS (
      SELECT 1 FROM exhibitors
      WHERE id = receiver_id AND user_id = auth.uid()
    ))
  )
);

-- Allow anyone to insert messages
CREATE POLICY "Anyone can insert messages"
ON messages
FOR INSERT
TO public
WITH CHECK (true);