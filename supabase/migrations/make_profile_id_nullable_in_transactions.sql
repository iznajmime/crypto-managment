/*
  # Make profile_id Nullable in Transactions

  This migration updates the `transactions` table to allow the `profile_id` to be nullable.

  1. Changes
    - The `profile_id` column in the `transactions` table is altered to be optional (nullable).
    - This change supports the single-fund model where `BUY` and `SELL` transactions are portfolio-wide and not tied to a specific client, while `DEPOSIT` and `WITHDRAW` transactions remain associated with a client.
*/

ALTER TABLE public.transactions ALTER COLUMN profile_id DROP NOT NULL;