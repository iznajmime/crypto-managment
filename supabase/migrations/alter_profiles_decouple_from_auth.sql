/*
  # Decouple Profiles from Auth Users

  This migration updates the `profiles` table to remove its direct dependency on the `auth.users` table. This change is necessary to allow the creation of client profiles that are not associated with a system user account, which aligns with the app's functionality of a single manager managing multiple clients.

  1. Changes
    - The foreign key constraint linking `profiles.id` to `auth.users.id` has been removed.
    - The `profiles.id` column now automatically generates a UUID, making it a standalone primary key.
*/

-- Drop the foreign key constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Alter the id column to set a default UUID value
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();