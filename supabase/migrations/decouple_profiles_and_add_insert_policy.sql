/*
  # Decouple Profiles from Auth Users and Add Insert Policy

  This migration decouples the `profiles` table from `auth.users` to allow for the creation of client profiles that are not associated with an authenticated user. It also adds the necessary security policy to allow insertions.

  1. Changes
    - The foreign key constraint linking `profiles.id` to `auth.users.id` is removed.
    - The `profiles.id` column is updated to automatically generate a `uuid` using `gen_random_uuid()` as its default value. This makes it a standalone, auto-generating primary key.

  2. Security
    - A new policy is added to allow authenticated users to insert new profiles, which is required for the "New Client" form to work.
*/

-- Step 1: Find and drop the foreign key constraint if it exists.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND confrelid = 'auth.users'::regclass
      AND contype = 'f'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Step 2: Set a default value for the id column to auto-generate UUIDs.
ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 3: Add an insert policy for authenticated users if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Allow authenticated users to insert profiles'
    AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Allow authenticated users to insert profiles"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;