/*
  # Remove automatic user creation for speakers

  1. Changes
    - Drop trigger for automatic user creation
    - Drop functions related to user creation
    - Keep email column and index for backward compatibility
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS create_speaker_user_trigger ON speakers;

-- Drop functions
DROP FUNCTION IF EXISTS create_speaker_user();
DROP FUNCTION IF EXISTS generate_random_password();

-- Remove user_id foreign key constraint if it exists
ALTER TABLE speakers
DROP CONSTRAINT IF EXISTS speakers_user_id_fkey;

-- Make user_id nullable
ALTER TABLE speakers
ALTER COLUMN user_id DROP NOT NULL;

-- Update existing speakers to remove user_id
UPDATE speakers
SET user_id = NULL;