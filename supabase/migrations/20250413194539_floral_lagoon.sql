/*
  # Add User Roles and Permissions Schema

  1. New Tables
    - `roles` - System roles (admin, organizer, speaker, etc.)
    - `permissions` - Available system permissions
    - `role_permissions` - Mapping between roles and permissions
    - `user_roles` - Mapping between users and roles

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for role-based access
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage roles"
  ON roles
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can manage permissions"
  ON permissions
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Platform administrators with full access'),
  ('organizer', 'Event organizers who can create and manage their events'),
  ('speaker', 'Speakers who can manage their sessions and interact with attendees'),
  ('exhibitor', 'Exhibitors who can manage their virtual stands'),
  ('moderator', 'Content moderators who can manage chats and questions'),
  ('attendee', 'Regular event attendees')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  -- Admin permissions
  ('manage_platform', 'Manage platform settings and configurations', 'platform', 'manage'),
  ('manage_users', 'Manage all user accounts', 'users', 'manage'),
  ('view_analytics', 'View platform-wide analytics', 'analytics', 'view'),
  ('manage_roles', 'Manage user roles and permissions', 'roles', 'manage'),
  ('moderate_content', 'Moderate all platform content', 'content', 'moderate'),
  
  -- Organizer permissions
  ('create_event', 'Create new events', 'events', 'create'),
  ('manage_event', 'Manage event details and settings', 'events', 'manage'),
  ('manage_speakers', 'Manage event speakers', 'speakers', 'manage'),
  ('manage_schedule', 'Manage event schedule', 'schedule', 'manage'),
  ('view_event_analytics', 'View event-specific analytics', 'event_analytics', 'view'),
  
  -- Speaker permissions
  ('manage_session', 'Manage own session details', 'sessions', 'manage'),
  ('interact_attendees', 'Interact with session attendees', 'attendees', 'interact'),
  ('share_content', 'Share content during sessions', 'content', 'share'),
  
  -- Exhibitor permissions
  ('manage_stand', 'Manage virtual stand', 'stands', 'manage'),
  ('interact_visitors', 'Interact with stand visitors', 'visitors', 'interact'),
  ('view_stand_analytics', 'View stand-specific analytics', 'stand_analytics', 'view'),
  
  -- Moderator permissions
  ('moderate_chat', 'Moderate chat messages', 'chat', 'moderate'),
  ('moderate_questions', 'Moderate Q&A sessions', 'questions', 'moderate'),
  ('manage_reports', 'Handle user reports and issues', 'reports', 'manage'),
  
  -- Attendee permissions
  ('view_events', 'View available events', 'events', 'view'),
  ('register_events', 'Register for events', 'events', 'register'),
  ('participate_chat', 'Participate in event chat', 'chat', 'participate'),
  ('ask_questions', 'Ask questions during sessions', 'questions', 'ask')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE 
  (r.name = 'admin') OR
  (r.name = 'organizer' AND p.name IN (
    'create_event', 'manage_event', 'manage_speakers', 'manage_schedule', 'view_event_analytics'
  )) OR
  (r.name = 'speaker' AND p.name IN (
    'manage_session', 'interact_attendees', 'share_content'
  )) OR
  (r.name = 'exhibitor' AND p.name IN (
    'manage_stand', 'interact_visitors', 'view_stand_analytics'
  )) OR
  (r.name = 'moderator' AND p.name IN (
    'moderate_chat', 'moderate_questions', 'manage_reports'
  )) OR
  (r.name = 'attendee' AND p.name IN (
    'view_events', 'register_events', 'participate_chat', 'ask_questions'
  ))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
  user_id uuid,
  permission_name text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_id
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(
  user_id uuid
) RETURNS TABLE (role_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(
  user_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id
    AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;