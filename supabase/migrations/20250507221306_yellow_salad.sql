/*
  # Create messages table for user-exhibitor communication

  1. New Tables
    - `messages` - Store messages between users and exhibitors
      - `id` (uuid, primary key)
      - `sender_id` (uuid)
      - `sender_type` (text, either 'user' or 'exhibitor')
      - `receiver_id` (uuid)
      - `receiver_type` (text, either 'user' or 'exhibitor')
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for proper access control
    - Allow users and exhibitors to send and view their messages
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'exhibitor')),
  receiver_id uuid NOT NULL,
  receiver_type text NOT NULL CHECK (receiver_type IN ('user', 'exhibitor')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_sender_type_idx ON messages(sender_type);
CREATE INDEX IF NOT EXISTS messages_receiver_type_idx ON messages(receiver_type);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is sender
  (sender_type = 'user' AND sender_id = auth.uid()) OR
  -- User is exhibitor's user
  (sender_type = 'exhibitor' AND EXISTS (
    SELECT 1 FROM exhibitors
    WHERE id = sender_id AND user_id = auth.uid()
  ))
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;