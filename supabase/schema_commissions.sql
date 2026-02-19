-- =====================================================
-- Commission Engine - Database Schema
-- =====================================================
-- Creates commissions table with RLS policies
-- Run this BEFORE commission_upload.sql

-- =====================================================
-- STEP 1: Create commissions table
-- =====================================================

CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(agent_id),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  
  -- Agent details (from CSV)
  state_name TEXT,
  zone_name TEXT,
  district TEXT,
  mandal TEXT,
  base_branch TEXT,
  sol_id TEXT,
  village_name TEXT,
  bca_name TEXT,
  agent_id_bank TEXT,
  settlement_account TEXT,
  date_of_joining DATE,
  device_id TEXT,
  company_name TEXT,
  location_type TEXT,
  
  -- Account Opening Details
  non_funded_account_open_count INTEGER DEFAULT 0,
  non_funded_account_open_comm NUMERIC(15, 2) DEFAULT 0,
  funded_account_open_count INTEGER DEFAULT 0,
  funded_account_open_comm NUMERIC(15, 2) DEFAULT 0,
  total_account_open_count INTEGER DEFAULT 0,
  total_account_open_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Financial Transactions
  financial_txn_count INTEGER DEFAULT 0,
  financial_txn_amount NUMERIC(15, 2) DEFAULT 0,
  financial_txn_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Remittance
  remittance_count INTEGER DEFAULT 0,
  remittance_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Login Activity
  login_days INTEGER DEFAULT 0,
  fixed_commission NUMERIC(15, 2) DEFAULT 0,
  
  -- Government Schemes - APY (Atal Pension Yojana)
  apy_count INTEGER DEFAULT 0,
  apy_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Government Schemes - PMSBY (Pradhan Mantri Suraksha Bima Yojana)
  pmsby_count INTEGER DEFAULT 0,
  pmsby_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Government Schemes - PMJBY (Pradhan Mantri Jeevan Jyoti Bima Yojana)
  pmjby_count INTEGER DEFAULT 0,
  pmjby_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Incentives
  sss_incentive NUMERIC(15, 2) DEFAULT 0,  -- 10% INCENTIVE for SSS
  
  -- Re-KYC
  rekyc_count INTEGER DEFAULT 0,
  rekyc_comm NUMERIC(15, 2) DEFAULT 0,
  
  -- Final Commission (calculated totals)
  net_commission NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bc_comm NUMERIC(15, 2) NOT NULL DEFAULT 0,
  corp_comm NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- TDS columns (calculated in app layer, stored permanently)
  tds_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  tds_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  agent_net_payable NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- Approval workflow
  approved BOOLEAN DEFAULT FALSE NOT NULL,
  approved_at TIMESTAMP,
  approved_by TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one record per agent per month/year
  UNIQUE(agent_id, month, year)
);

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_commissions_month_year 
  ON commissions(month, year);

CREATE INDEX IF NOT EXISTS idx_commissions_agent 
  ON commissions(agent_id);

CREATE INDEX IF NOT EXISTS idx_commissions_approved 
  ON commissions(approved);

CREATE INDEX IF NOT EXISTS idx_commissions_agent_month_year 
  ON commissions(agent_id, month, year);

-- =====================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: RLS Policy - Admin Full Access
-- =====================================================

DROP POLICY IF EXISTS admin_all_commissions ON commissions;

CREATE POLICY admin_all_commissions ON commissions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- STEP 5: RLS Policy - Agents View Own Approved Only
-- =====================================================
-- Agents can ONLY see their own approved commissions
-- Never unapproved or other agents' data

DROP POLICY IF EXISTS agent_view_own_approved ON commissions;

CREATE POLICY agent_view_own_approved ON commissions
  FOR SELECT
  USING (
    agent_id = (
      SELECT agent_id FROM profiles WHERE id = auth.uid()
    )
    AND approved = TRUE
  );

-- =====================================================
-- STEP 6: Create updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_commission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commission_updated_at ON commissions;

CREATE TRIGGER commission_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_timestamp();

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify table structure:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'commissions'
-- ORDER BY ordinal_position;
