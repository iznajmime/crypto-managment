/*
  # Reset RLS Policies for Profiles Table

  This migration performs a complete reset of the Row Level Security (RLS) policies for the `profiles` table. The previous policies were causing conflicts, specifically preventing new client profiles from being created.

  1. Changes
    - All existing policies on the `public.profiles` table are dropped to ensure a clean slate.
    - RLS is explicitly enabled on the table.

  2. Security
    - A new, comprehensive set of policies is created to grant full CRUD (Create, Read, Update, Delete) access to any authenticated user. This is appropriate for this application, where a single manager needs to manage all client data.
      - `SELECT`: Authenticated users can view all profiles.
      - `INSERT`: Authenticated users can create new profiles.
      - `UPDATE`: Authenticated users can update any profile.
      - `DELETE`: Authenticated users can delete any profile.
*/

-- Step 1: Ensure Row Level Security is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on the profiles table to avoid conflicts.
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN
        SELECT polname FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON public.profiles;';
    END LOOP;
END $$;

-- Step 3: Create a full set of permissive policies for authenticated users.

-- Allow authenticated users to view all profiles.
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert new profiles.
CREATE POLICY "Allow authenticated users to insert new profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update any profile.
CREATE POLICY "Allow authenticated users to update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete any profile.
CREATE POLICY "Allow authenticated users to delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (true);