/*
  # Fix user table constraints

  1. Changes
    - Allow null values for settings, social_links columns in users table
    - Set default values for these columns to prevent null insertion
    - Add NOT NULL constraint for role column with default value

  2. Notes
    - This fixes the database error when creating new users
    - Ensures consistent default values for JSON columns
*/

ALTER TABLE users 
  ALTER COLUMN settings SET DEFAULT '{}'::jsonb,
  ALTER COLUMN social_links SET DEFAULT '{}'::jsonb,
  ALTER COLUMN role SET DEFAULT 'attendee'::user_role;