-- 1. Ensure the updated_at column exists
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Recreate the trigger function to be absolutely sure it's correct
CREATE OR REPLACE FUNCTION update_commission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- We now guarantee the column exists before the trigger fires
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger on the table
DROP TRIGGER IF EXISTS commission_updated_at ON public.commissions;

CREATE TRIGGER commission_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_timestamp();

-- 4. Verify columns again
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'commissions'
  AND column_name IN ('approved_at', 'approved_by', 'updated_at');
