-- 1. Ensure the updated_at column exists on commission_column_settings
ALTER TABLE public.commission_column_settings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Recreate the trigger function to ensure the cached definition is cleared
CREATE OR REPLACE FUNCTION update_column_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- We now guarantee the column exists before the trigger fires
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger on the table
DROP TRIGGER IF EXISTS column_settings_updated_at ON public.commission_column_settings;

CREATE TRIGGER column_settings_updated_at
  BEFORE UPDATE ON public.commission_column_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_column_settings_timestamp();

-- 4. Verify the column exists
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'commission_column_settings'
  AND column_name = 'updated_at';
