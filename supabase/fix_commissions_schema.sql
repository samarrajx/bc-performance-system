-- Add ALL columns from User DDL to commissions table
-- This covers Agent Details, Account Opening, Financials, Schemes, and Incentives

-- 1. Agent Details
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS state_name TEXT,
ADD COLUMN IF NOT EXISTS zone_name TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS mandal TEXT,
ADD COLUMN IF NOT EXISTS base_branch TEXT,
ADD COLUMN IF NOT EXISTS sol_id TEXT,
ADD COLUMN IF NOT EXISTS village_name TEXT,
ADD COLUMN IF NOT EXISTS bca_name TEXT,
ADD COLUMN IF NOT EXISTS agent_id_bank TEXT,
ADD COLUMN IF NOT EXISTS settlement_account TEXT,
ADD COLUMN IF NOT EXISTS date_of_joining DATE,
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT;

-- 2. Account Opening
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS non_funded_account_open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS non_funded_account_open_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS funded_account_open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS funded_account_open_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_account_open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_account_open_comm NUMERIC(15, 2) DEFAULT 0;

-- 3. Financial Transactions
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS financial_txn_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS financial_txn_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS financial_txn_comm NUMERIC(15, 2) DEFAULT 0;

-- 4. Remittance
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS remittance_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remittance_comm NUMERIC(15, 2) DEFAULT 0;

-- 5. Login & Fixed
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS login_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixed_commission NUMERIC(15, 2) DEFAULT 0;

-- 6. Government Schemes
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS apy_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apy_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pmsby_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pmsby_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pmjby_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pmjby_comm NUMERIC(15, 2) DEFAULT 0;

-- 7. Incentives & Re-KYC
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS sss_incentive NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rekyc_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rekyc_comm NUMERIC(15, 2) DEFAULT 0;

-- 8. Final Commission Components
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS bc_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS corp_comm NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_commission NUMERIC(15, 2) DEFAULT 0;

-- 9. TDS Columns
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS tds_percent NUMERIC(5, 2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS agent_net_payable NUMERIC(15, 2) DEFAULT 0;

-- 10. Update RLS Policy (from User DDL)
-- User DDL defines a unique constraint which we should ensure exists
ALTER TABLE public.commissions
DROP CONSTRAINT IF EXISTS commissions_agent_id_month_year_key;

ALTER TABLE public.commissions
ADD CONSTRAINT commissions_agent_id_month_year_key UNIQUE (agent_id, month, year);

-- Verify columns
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'commissions';
