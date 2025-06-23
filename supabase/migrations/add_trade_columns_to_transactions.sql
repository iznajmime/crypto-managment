/*
  # Add Trade-Specific Columns to Transactions

  This migration enhances the `transactions` table by adding columns required for tracking detailed trade information, specifically the quantity of an asset and its price at the time of the transaction.

  1.  **Summary of Changes**
      - Adds `asset_quantity` and `price_per_asset_usd` to the `transactions` table.

  2.  **Table Modifications**
      - **`transactions` table**:
        - `asset_quantity` (numeric, not null, default 0): Stores the amount of the asset being transacted (e.g., how many BTC were bought).
        - `price_per_asset_usd` (numeric, not null, default 0): Stores the price of a single unit of the asset in USD at the time of the transaction.

  3.  **Security Impact**
      - No changes to RLS policies. The existing policies for the `transactions` table will apply to these new columns.
*/

-- Add asset_quantity column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'asset_quantity'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN asset_quantity numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add price_per_asset_usd column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'price_per_asset_usd'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN price_per_asset_usd numeric NOT NULL DEFAULT 0;
  END IF;
END $$;