-- 1. Check if updated_at exists in commissions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commissions' 
  AND column_name = 'updated_at';

-- 2. Check the trigger definition
SELECT tgname AS trigger_name, proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE pg_trigger.tgrelid = 'commissions'::regclass;
