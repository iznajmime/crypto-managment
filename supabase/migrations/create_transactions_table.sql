/*
  # Create transactions table

  This migration creates the `transactions` table to log all financial activities, such as deposits, withdrawals, and trades.

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key): Unique identifier for each transaction.
      - `created_at` (timestamptz): Timestamp of the transaction.
      - `profile_id` (uuid): Foreign key linking to the `profiles` table.
      - `transaction_type` (text): The type of transaction (e.g., 'DEPOSIT').
      - `asset` (text): The asset involved (e.g., 'USD').
      - `transaction_value_usd` (numeric): The value of the transaction in USD.

  2. Security
    - Enable RLS on the `transactions` table.
    - Add policies to allow authenticated users to create and read transactions.
*/

-- Create the transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  asset text NOT NULL,
  transaction_value_usd numeric NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read transactions
CREATE POLICY "Allow authenticated users to read transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add policy for authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);