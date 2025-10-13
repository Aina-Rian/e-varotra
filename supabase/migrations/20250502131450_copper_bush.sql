/*
  # Fix exhibitor messages user relationship

  1. Changes
    - Add foreign key relationship between exhibitor_messages and auth.users
    - Update RLS policies to handle user relationships correctly

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user access control
*/

-- Drop existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'exhibitor_messages_user_id_fkey'
  ) THEN
    ALTER TABLE exhibitor_messages DROP CONSTRAINT exhibitor_messages_user_id_fkey;
  END IF;
END $$;

-- Add foreign key relationship to auth.users
ALTER TABLE exhibitor_messages
ADD CONSTRAINT exhibitor_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the RLS policies to handle the user relationship
ALTER TABLE exhibitor_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Exhibitor messages insertable by participants" ON exhibitor_messages;
DROP POLICY IF EXISTS "Exhibitor messages viewable by exhibitors" ON exhibitor_messages;
DROP POLICY IF EXISTS "Exhibitor messages viewable by organizers" ON exhibitor_messages;
DROP POLICY IF EXISTS "Exhibitor messages viewable by participants" ON exhibitor_messages;

-- Recreate policies with correct user handling
CREATE POLICY "Exhibitor messages insertable by participants"
ON exhibitor_messages
FOR INSERT
TO authenticated
WITH CHECK (
  ((user_id = auth.uid() AND staff_id IS NULL) OR (staff_id = auth.uid() AND user_id IS NULL))
);

CREATE POLICY "Exhibitor messages viewable by exhibitors"
ON exhibitor_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_messages.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor messages viewable by organizers"
ON exhibitor_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_messages.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor messages viewable by participants"
ON exhibitor_messages
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid() OR staff_id = auth.uid() OR NOT is_private)
);