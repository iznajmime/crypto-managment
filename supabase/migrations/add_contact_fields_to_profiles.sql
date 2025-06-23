/*
  # Add Contact Fields to Profiles

  This migration enhances the `profiles` table by adding optional fields for storing client contact information.

  1. Changes
    - A new `email` column (text) has been added to store client email addresses.
    - A new `phoneNumber` column (text) has been added to store client phone numbers.
    - Both fields are optional to accommodate cases where this information is not provided.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phoneNumber'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN "phoneNumber" TEXT;
  END IF;
END $$;