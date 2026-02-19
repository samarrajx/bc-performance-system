-- =====================================================
-- Commission Column Settings Schema
-- =====================================================
-- Dynamic configuration for commission columns
-- Controls CSV validation, header mapping, and display

-- =====================================================
-- STEP 1: Create commission_column_settings table
-- =====================================================

CREATE TABLE IF NOT EXISTS commission_column_settings (
  id SERIAL PRIMARY KEY,
  column_key TEXT NOT NULL,
  csv_header_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Add unique constraint on column_key
-- =====================================================

ALTER TABLE commission_column_settings
DROP CONSTRAINT IF EXISTS unique_column_key;

ALTER TABLE commission_column_settings
ADD CONSTRAINT unique_column_key UNIQUE (column_key);

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_column_settings_active 
  ON commission_column_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_column_settings_display_order 
  ON commission_column_settings(display_order);

-- =====================================================
-- STEP 4: Insert initial column settings
-- =====================================================

-- Delete existing data to avoid conflicts
TRUNCATE TABLE commission_column_settings RESTART IDENTITY CASCADE;

-- Insert all commission columns with proper mapping
INSERT INTO commission_column_settings
(column_key, csv_header_name, is_required, is_active, display_order)
VALUES
-- Core Required Columns (cannot be disabled)
('bc_comm', 'BC_COMM', TRUE, TRUE, 1),
('corp_comm', 'CORP_COMM', TRUE, TRUE, 2),
('net_commission', 'NET COMMISSION', TRUE, TRUE, 3),

-- Agent Details (informational, not required for calculation)
('state_name', 'STATE_NAME', FALSE, TRUE, 10),
('zone_name', 'ZONE_NAME', FALSE, TRUE, 11),
('district', 'DIST', FALSE, TRUE, 12),
('mandal', 'Mandal', FALSE, TRUE, 13),
('base_branch', 'BASE_BRANCH', FALSE, TRUE, 14),
('sol_id', 'SOL_ID', FALSE, TRUE, 15),
('village_name', 'VILLAGE_NAME', FALSE, TRUE, 16),
('bca_name', 'BCA_NAME', FALSE, TRUE, 17),
('agent_id_bank', 'AGENT ID BANK', FALSE, TRUE, 18),
('settlement_account', 'SETT_ACCNO', FALSE, TRUE, 19),
('date_of_joining', 'DATE OF JOINING', FALSE, TRUE, 20),
('device_id', 'Device ID', FALSE, TRUE, 21),
('company_name', 'Company Name', FALSE, TRUE, 22),
('location_type', 'Location Type', FALSE, TRUE, 23),

-- Account Opening
('non_funded_account_open_count', 'NON FUNDED_NO_OF_ACCT_OPN', FALSE, TRUE, 30),
('non_funded_account_open_comm', 'COMM_ACCT_OPN', FALSE, TRUE, 31),
('funded_account_open_count', 'FUNDED_NO_OF_ACCT_OPN', FALSE, TRUE, 32),
('funded_account_open_comm', 'COMM_ACCT_OPN', FALSE, TRUE, 33),
('total_account_open_count', 'TOTAL_NO_OF_ACCT_OPN', FALSE, TRUE, 34),
('total_account_open_comm', 'COMM_ACCT_OPN', FALSE, TRUE, 35),

-- Financial Transactions
('financial_txn_count', 'FINANCIAL_TXN', FALSE, TRUE, 40),
('financial_txn_amount', 'TXN_AMT', FALSE, TRUE, 41),
('financial_txn_comm', 'TXN_COMM', FALSE, TRUE, 42),

-- Remittance
('remittance_count', 'Remmittance count', FALSE, TRUE, 50),
('remittance_comm', 'remmittance/Rs10', FALSE, TRUE, 51),

-- Login Activity
('login_days', 'Login days', FALSE, TRUE, 60),
('fixed_commission', 'fixd commission', FALSE, TRUE, 61),

-- Government Schemes
('apy_count', 'APY COUNT', FALSE, TRUE, 70),
('apy_comm', 'APY COMM', FALSE, TRUE, 71),
('pmsby_count', 'SBY COUNT', FALSE, TRUE, 72),
('pmsby_comm', 'SBY COMM', FALSE, TRUE, 73),
('pmjby_count', 'JBY COUNT', FALSE, TRUE, 74),
('pmjby_comm', 'JBY COMM', FALSE, TRUE, 75),

-- Incentives & Re-KYC
('sss_incentive', '10 % INCENTIVE for SSS', FALSE, TRUE, 80),
('rekyc_count', 'Re-KYC Count', FALSE, TRUE, 81),
('rekyc_comm', 'Re-KYC Comm', FALSE, TRUE, 82);

-- =====================================================
-- STEP 5: Create update trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_column_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS column_settings_updated_at ON commission_column_settings;

CREATE TRIGGER column_settings_updated_at
  BEFORE UPDATE ON commission_column_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_column_settings_timestamp();

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify setup:
--
-- SELECT column_key, csv_header_name, is_required, is_active, display_order
-- FROM commission_column_settings
-- ORDER BY display_order;
