/*
  # Create RPC for Atomic Deposit Updates

  This migration creates a remote procedure call (RPC) in PostgreSQL to handle atomic updates to a client's `total_deposited_usd`.

  1. New Functions
    - `update_client_deposit(client_id uuid, deposit_amount numeric)`
      - This function takes a client's ID and a numeric amount (positive for deposit, negative for withdrawal).
      - It atomically adds the `deposit_amount` to the `total_deposited_usd` for the specified client.
      - Using an RPC ensures that the read-modify-write operation is safe from race conditions, guaranteeing data integrity when multiple operations could occur concurrently.

  2. Security
    - The function is defined with `SECURITY DEFINER` to run with the permissions of the user that defined it, but access should still be controlled via RLS on the `profiles` table if necessary, though direct function calls are typically restricted to authenticated users.
*/

CREATE OR REPLACE FUNCTION public.update_client_deposit(
    client_id uuid,
    deposit_amount numeric
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET total_deposited_usd = total_deposited_usd + deposit_amount
  WHERE id = client_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;