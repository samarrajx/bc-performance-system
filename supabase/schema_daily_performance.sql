-- =====================================================
-- DAILY PERFORMANCE TABLE SCHEMA
-- =====================================================
-- Run this in Supabase SQL Editor BEFORE running daily_upload.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_performance (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id),
  date DATE NOT NULL,
  
  -- Location and identification fields
  state TEXT,
  zone TEXT,
  sol_id TEXT,
  bc_agent_name TEXT,
  od_account_number TEXT,
  
  -- Deposit transactions
  deposit_count INTEGER DEFAULT 0,
  deposit_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- Withdrawal transactions
  withdrawal_count INTEGER DEFAULT 0,
  withdrawal_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- AEPS transactions
  aeps_onus_count INTEGER DEFAULT 0,
  aeps_onus_amt NUMERIC(15, 2) DEFAULT 0,
  aeps_offus_count INTEGER DEFAULT 0,
  aeps_offus_amt NUMERIC(15, 2) DEFAULT 0,
  
  -- Card transactions
  rupay_card_count INTEGER DEFAULT 0,
  rupay_card_amount NUMERIC(15, 2) DEFAULT 0,
  other_card_count INTEGER DEFAULT 0,
  other_card_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- Remittance
  remittance_count INTEGER DEFAULT 0,
  remittance_amt NUMERIC(15, 2) DEFAULT 0,
  
  -- Government schemes
  enrollment_count INTEGER DEFAULT 0,
  pmjby_count INTEGER DEFAULT 0,
  pmsby_count INTEGER DEFAULT 0,
  apy_count INTEGER DEFAULT 0,
  
  -- Online accounts
  online_account_count INTEGER DEFAULT 0,
  
  -- BC details
  bc_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one record per device per date
  UNIQUE(device_id, date)
);

-- Create index for date queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_daily_performance_date ON daily_performance(date);

-- Create index for device_id queries
CREATE INDEX IF NOT EXISTS idx_daily_performance_device ON daily_performance(device_id);

-- Create index for date range queries per device
CREATE INDEX IF NOT EXISTS idx_daily_performance_device_date ON daily_performance(device_id, date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;

-- Admin policy: Full access
CREATE POLICY admin_all_access ON daily_performance
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Agent policy: Read only for their assigned device and after joining date
-- NOTE: Adjust this based on your actual agents table structure
CREATE POLICY agent_read_own_device ON daily_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      -- Fixed: Extract Agent ID from email instead of using auth.uid() directly
      WHERE agents.agent_id = split_part(auth.jwt() ->> 'email', '@', 1)
      AND agents.assigned_device_id = daily_performance.device_id
      AND daily_performance.date >= agents.joining_date
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON daily_performance TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE daily_performance_id_seq TO authenticated;
