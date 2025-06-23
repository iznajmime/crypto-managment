/*
  # Create profiles table

  This migration creates the `profiles` table to store client information.

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key): Unique identifier for each profile, linked to `auth.users`.
      - `created_at` (timestamptz): Timestamp of when the profile was created.
      - `name` (text): The full name of the client.
      - `total_deposited_usd` (numeric): The total amount deposited by the client in USD.

  2. Security
    - Enable RLS on the `profiles` table.
    - Add a policy to allow authenticated users to read all profiles.
*/

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  total_deposited_usd numeric DEFAULT 0 NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read profiles
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);