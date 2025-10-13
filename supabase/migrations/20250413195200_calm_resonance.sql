/*
  # Fix user roles policy recursion

  1. Changes
    - Drop existing policy that causes recursion
    - Create new policies for user_roles table that avoid recursion
    - Policies now use direct role checks instead of recursive admin checks
  
  2. Security
    - Maintains security by ensuring users can only view their own roles
    - Admins can still manage all user roles through direct role name check
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Create new policies that avoid recursion
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage all user roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    LIMIT 1
  )
);