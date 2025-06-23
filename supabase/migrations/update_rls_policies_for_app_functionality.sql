/*
  # Update RLS Policies for App Functionality

  This migration updates the Row Level Security (RLS) policies for the `profiles` and `transactions` tables to ensure the application works as expected for authenticated users.

  1.  **Summary of Changes**
      - **`profiles` table**: The previous `SELECT` policy was too restrictive, preventing the app from retrieving a profile's data immediately after creation. This migration replaces it with a policy that allows any authenticated user to view all profiles.
      - **`transactions` table**: This table was missing RLS policies. Policies are added to allow authenticated users to read and insert transactions, which is necessary for logging deposits and other financial activities.

  2.  **New Policies**
      - **`profiles`**:
        - `Allow authenticated users to read all profiles`: Grants `SELECT` access on all rows to any user who is logged in.
      - **`transactions`**:
        - `Allow authenticated users to read all transactions`: Grants `SELECT` access.
        - `Allow authenticated users to insert transactions`: Grants `INSERT` access.

  3.  **Security Impact**
      - These changes are secure within the context of this application, where any logged-in user is considered a trusted fund manager who should have full visibility over all client data.
*/

-- Step 1: Drop the old, overly restrictive SELECT policy on the profiles table.
-- The old policy might have been named "Users can read own data" or similar.
-- We will drop it regardless of the name, as long as it's a SELECT policy for authenticated users.
DO $$
DECLARE
    policy_name text;
BEGIN
    SELECT pol.polname INTO policy_name
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    WHERE cls.relname = 'profiles' AND pol.polcmd = 'r' AND pol.polroles::text[] @> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]::text[]
    LIMIT 1;

    IF policy_name IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles;';
    END IF;
END $$;


-- Step 2: Create a new, correct SELECT policy on the profiles table.
CREATE POLICY "Allow authenticated users to read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Enable RLS on the transactions table if it's not already enabled.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Add SELECT and INSERT policies for the transactions table.
CREATE POLICY "Allow authenticated users to read all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);