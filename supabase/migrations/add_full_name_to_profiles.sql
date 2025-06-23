/*
      # Add Full Name to Profiles

      This migration adds the `full_name` column to the `profiles` table to store the client's full name, resolving an error in the Dashboard component.

      1. Changes
        - A new `full_name` column (of type `text`) has been added to the `profiles` table.
        - This directly addresses the 'column profiles.full_name does not exist' error.
    */

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'full_name'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
      END IF;
    END $$;