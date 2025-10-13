/*
  # Add Exhibitors Management

  1. New Tables
    - `exhibitors` - Store exhibitor information
    - `event_exhibitors` - Junction table linking events and exhibitors
    - `exhibitor_materials` - Store materials for exhibitor stands

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Allow organizers to manage exhibitors
*/

-- Create exhibitors table
CREATE TABLE IF NOT EXISTS exhibitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  contact_email text NOT NULL,
  contact_phone text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create event_exhibitors junction table
CREATE TABLE IF NOT EXISTS event_exhibitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  booth_number text,
  booth_size text,
  booth_type text DEFAULT 'standard',
  booth_location text,
  custom_theme jsonb DEFAULT '{}'::jsonb,
  is_sponsor boolean DEFAULT false,
  sponsor_level text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, exhibitor_id)
);

-- Create exhibitor_materials table
CREATE TABLE IF NOT EXISTS exhibitor_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  url text NOT NULL,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create exhibitor_analytics table
CREATE TABLE IF NOT EXISTS exhibitor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  visitor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create exhibitor_messages table
CREATE TABLE IF NOT EXISTS exhibitor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid REFERENCES exhibitors(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT sender_check CHECK (
    (user_id IS NOT NULL AND staff_id IS NULL) OR
    (user_id IS NULL AND staff_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS exhibitors_user_id_idx ON exhibitors(user_id);
CREATE INDEX IF NOT EXISTS event_exhibitors_event_id_idx ON event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS event_exhibitors_exhibitor_id_idx ON event_exhibitors(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_materials_exhibitor_id_idx ON exhibitor_materials(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_materials_event_id_idx ON exhibitor_materials(event_id);
CREATE INDEX IF NOT EXISTS exhibitor_analytics_exhibitor_id_idx ON exhibitor_analytics(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_analytics_event_id_idx ON exhibitor_analytics(event_id);
CREATE INDEX IF NOT EXISTS exhibitor_messages_exhibitor_id_idx ON exhibitor_messages(exhibitor_id);
CREATE INDEX IF NOT EXISTS exhibitor_messages_event_id_idx ON exhibitor_messages(event_id);

-- Enable RLS
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for exhibitors
CREATE POLICY "Exhibitors viewable by everyone"
ON exhibitors
FOR SELECT
TO public
USING (true);

CREATE POLICY "Exhibitors manageable by authenticated users"
ON exhibitors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for event_exhibitors
CREATE POLICY "Event exhibitors viewable by everyone"
ON event_exhibitors
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_exhibitors.event_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Event exhibitors manageable by organizers"
ON event_exhibitors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_exhibitors.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_exhibitors.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Event exhibitors manageable by exhibitors"
ON event_exhibitors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = event_exhibitors.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

-- Create policies for exhibitor_materials
CREATE POLICY "Exhibitor materials viewable by everyone"
ON exhibitor_materials
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.status IN ('published', 'live')
  )
);

CREATE POLICY "Exhibitor materials manageable by organizers"
ON exhibitor_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_materials.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor materials manageable by exhibitors"
ON exhibitor_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_materials.exhibitor_id
    AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_materials.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

-- Create policies for exhibitor_analytics
CREATE POLICY "Exhibitor analytics viewable by organizers"
ON exhibitor_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_analytics.event_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor analytics viewable by exhibitors"
ON exhibitor_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exhibitors e
    WHERE e.id = exhibitor_analytics.exhibitor_id
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Exhibitor analytics insertable by anyone"
ON exhibitor_analytics
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = exhibitor_analytics.event_id
    AND e.status IN ('published', 'live')
  )
);

-- Create policies for exhibitor_messages
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

CREATE POLICY "Exhibitor messages viewable by participants"
ON exhibitor_messages
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  staff_id = auth.uid() OR
  NOT is_private
);

CREATE POLICY "Exhibitor messages insertable by participants"
ON exhibitor_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND staff_id IS NULL) OR
  (staff_id = auth.uid() AND user_id IS NULL)
);

-- Create function to create exhibitor user
CREATE OR REPLACE FUNCTION create_exhibitor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_password text;
BEGIN
  -- Validate email is provided
  IF NEW.contact_email IS NULL OR NEW.contact_email = '' THEN
    RAISE EXCEPTION 'Email is required for exhibitor creation';
  END IF;

  -- Clean and validate email
  v_email := lower(trim(NEW.contact_email));
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', v_email;
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF FOUND THEN
    -- Use existing user
    NEW.user_id := v_user_id;
    
    -- Update users table if needed
    UPDATE public.users
    SET 
      full_name = COALESCE(full_name, NEW.company_name),
      company = COALESCE(company, NEW.company_name),
      role = COALESCE(role, 'exhibitor'::user_role),
      updated_at = now()
    WHERE id = v_user_id;
    
    RETURN NEW;
  END IF;

  -- Generate random password
  v_password := encode(gen_random_bytes(12), 'hex');

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  -- First create the user profile with explicit email
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      company,
      role,
      created_at,
      updated_at,
      settings,
      social_links
    )
    VALUES (
      v_user_id,
      v_email,
      NEW.company_name,
      NEW.company_name,
      'exhibitor',
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb
    );
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: % (email: %)', SQLERRM, v_email;
  END;

  -- Then create auth user
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'full_name', NEW.company_name,
        'company', NEW.company_name,
        'role', 'exhibitor',
        'email', v_email
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex')
    );
  EXCEPTION WHEN others THEN
    -- Clean up the user profile if auth user creation fails
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE EXCEPTION 'Failed to create auth user: % (email: %)', SQLERRM, v_email;
  END;

  -- Update exhibitor with user_id
  NEW.user_id := v_user_id;

  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log any other errors
  RAISE EXCEPTION 'Error in create_exhibitor_user: % (email: %)', SQLERRM, COALESCE(NEW.contact_email, 'NULL');
END;
$$;

-- Create trigger for exhibitor user creation
CREATE TRIGGER create_exhibitor_user_trigger
  BEFORE INSERT ON exhibitors
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION create_exhibitor_user();

-- Create storage bucket for exhibitor materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('exhibitor-materials', 'exhibitor-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Exhibitors can upload materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exhibitor-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM exhibitors e
    WHERE e.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view exhibitor materials"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'exhibitor-materials'
);

-- Create function to track exhibitor analytics
CREATE OR REPLACE FUNCTION track_exhibitor_view(
  p_exhibitor_id uuid,
  p_event_id uuid,
  p_action_type text DEFAULT 'view',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO exhibitor_analytics (
    exhibitor_id,
    event_id,
    visitor_id,
    action_type,
    metadata
  )
  VALUES (
    p_exhibitor_id,
    p_event_id,
    auth.uid(),
    p_action_type,
    p_metadata
  );
END;
$$;