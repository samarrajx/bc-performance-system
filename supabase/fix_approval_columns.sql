-- The User DDL was missing approved_at, approved_by AND updated_at
-- This causes the Approve action in Admin Panel to fail due to triggers

ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Verify columns
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'commissions';
