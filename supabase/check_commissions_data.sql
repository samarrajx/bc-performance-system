-- Check if data exists for the requested month/year
SELECT count(*) as total_rows, month, year 
FROM commissions 
GROUP BY month, year;

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'commissions';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'commissions';
