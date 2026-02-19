-- =====================================================
-- Commission Upload RPC Function
-- =====================================================
-- Handles commission data upload with full replace logic
-- Prerequisites: Run schema_commissions.sql first

CREATE OR REPLACE FUNCTION commission_upload(
  commission_data JSONB,
  upload_month INTEGER,
  upload_year INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_row JSONB;
  v_agent_id TEXT;
BEGIN
  -- =====================================================
  -- STEP 1: Validate month and year
  -- =====================================================
  
  IF upload_month < 1 OR upload_month > 12 THEN
    RAISE EXCEPTION 'Invalid month: %. Must be between 1 and 12', upload_month;
  END IF;
  
  IF upload_year < 2020 THEN
    RAISE EXCEPTION 'Invalid year: %. Must be 2020 or later', upload_year;
  END IF;
  
  -- =====================================================
  -- STEP 2: Delete ALL existing records for this month/year (FULL REPLACE)
  -- =====================================================
  
  DELETE FROM commissions 
  WHERE month = upload_month AND year = upload_year;
  
  -- =====================================================
  -- STEP 3: Insert new commission records
  -- =====================================================
  
  FOR v_row IN SELECT * FROM jsonb_array_elements(commission_data)
  LOOP
    v_agent_id := v_row->>'agent_id';
    
    -- Skip rows with empty agent_id (should be caught by frontend validation)
    IF v_agent_id IS NULL OR v_agent_id = '' THEN
      CONTINUE;
    END IF;
    
    -- Insert commission record with ALL detail columns
    -- Note: TDS values are pre-calculated in application layer
    INSERT INTO commissions (
      agent_id, month, year,
      
      -- Agent details
      state_name, zone_name, district, mandal, base_branch, sol_id,
      village_name, bca_name, agent_id_bank, settlement_account,
      date_of_joining, device_id, company_name, location_type,
      
      -- Account Opening
      non_funded_account_open_count, non_funded_account_open_comm,
      funded_account_open_count, funded_account_open_comm,
      total_account_open_count, total_account_open_comm,
      
      -- Financial Transactions
      financial_txn_count, financial_txn_amount, financial_txn_comm,
      
      -- Remittance
      remittance_count, remittance_comm,
      
      -- Login & Fixed
      login_days, fixed_commission,
      
      -- Government Schemes
      apy_count, apy_comm,
      pmsby_count, pmsby_comm,
      pmjby_count, pmjby_comm,
      
      -- Incentives & Re-KYC
      sss_incentive, rekyc_count, rekyc_comm,
      
      -- Final Commission
      net_commission, bc_comm, corp_comm,
      
      -- TDS
      tds_percent, tds_amount, agent_net_payable,
      
      approved
    ) VALUES (
      v_agent_id, upload_month, upload_year,
      
      -- Agent details
      v_row->>'state_name', v_row->>'zone_name', v_row->>'district',
      v_row->>'mandal', v_row->>'base_branch', v_row->>'sol_id',
      v_row->>'village_name', v_row->>'bca_name', v_row->>'agent_id_bank',
      v_row->>'settlement_account', (v_row->>'date_of_joining')::DATE,
      v_row->>'device_id', v_row->>'company_name', v_row->>'location_type',
      
      -- Account Opening
      COALESCE((v_row->>'non_funded_account_open_count')::INTEGER, 0),
      COALESCE((v_row->>'non_funded_account_open_comm')::NUMERIC, 0),
      COALESCE((v_row->>'funded_account_open_count')::INTEGER, 0),
      COALESCE((v_row->>'funded_account_open_comm')::NUMERIC, 0),
      COALESCE((v_row->>'total_account_open_count')::INTEGER, 0),
      COALESCE((v_row->>'total_account_open_comm')::NUMERIC, 0),
      
      -- Financial Transactions
      COALESCE((v_row->>'financial_txn_count')::INTEGER, 0),
      COALESCE((v_row->>'financial_txn_amount')::NUMERIC, 0),
      COALESCE((v_row->>'financial_txn_comm')::NUMERIC, 0),
      
      -- Remittance
      COALESCE((v_row->>'remittance_count')::INTEGER, 0),
      COALESCE((v_row->>'remittance_comm')::NUMERIC, 0),
      
      -- Login & Fixed
      COALESCE((v_row->>'login_days')::INTEGER, 0),
      COALESCE((v_row->>'fixed_commission')::NUMERIC, 0),
      
      -- Government Schemes
      COALESCE((v_row->>'apy_count')::INTEGER, 0),
      COALESCE((v_row->>'apy_comm')::NUMERIC, 0),
      COALESCE((v_row->>'pmsby_count')::INTEGER, 0),
      COALESCE((v_row->>'pmsby_comm')::NUMERIC, 0),
      COALESCE((v_row->>'pmjby_count')::INTEGER, 0),
      COALESCE((v_row->>'pmjby_comm')::NUMERIC, 0),
      
      -- Incentives & Re-KYC
      COALESCE((v_row->>'sss_incentive')::NUMERIC, 0),
      COALESCE((v_row->>'rekyc_count')::INTEGER, 0),
      COALESCE((v_row->>'rekyc_comm')::NUMERIC, 0),
      
      -- Final Commission
      COALESCE((v_row->>'net_commission')::NUMERIC, 0),
      COALESCE((v_row->>'bc_comm')::NUMERIC, 0),
      COALESCE((v_row->>'corp_comm')::NUMERIC, 0),
      
      -- TDS
      COALESCE((v_row->>'tds_percent')::NUMERIC, 2.00),
      COALESCE((v_row->>'tds_amount')::NUMERIC, 0),
      COALESCE((v_row->>'agent_net_payable')::NUMERIC, 0),
      
      FALSE  -- Always insert as unapproved
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  -- =====================================================
  -- STEP 4: Log successful upload
  -- =====================================================
  
  INSERT INTO upload_logs (
    file_type,
    file_name,
    upload_mode,
    rows_count,
    status
  ) VALUES (
    'COMMISSION_UPLOAD',
    'commission_' || upload_month || '_' || upload_year || '.xlsx',
    'REPLACE',
    v_inserted_count,
    'SUCCESS'
  );
  
  -- =====================================================
  -- STEP 5: Return summary
  -- =====================================================
  
  RETURN jsonb_build_object(
    'inserted_count', v_inserted_count,
    'month', upload_month,
    'year', upload_year,
    'status', 'SUCCESS'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- =====================================================
  -- Error handling: Log failed upload and re-raise
  -- =====================================================
  
  INSERT INTO upload_logs (
    file_type,
    file_name,
    upload_mode,
    rows_count,
    status,
    error_message
  ) VALUES (
    'COMMISSION_UPLOAD',
    'commission_' || upload_month || '_' || upload_year || '.xlsx',
    'REPLACE',
    0,
    'FAILED',
    SQLERRM
  );
  
  RAISE;
END;
$$;

-- =====================================================
-- Grant execute permission to authenticated users
-- =====================================================

GRANT EXECUTE ON FUNCTION commission_upload(JSONB, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- Test query (run after upload)
-- =====================================================
-- SELECT COUNT(*), month, year
-- FROM commissions
-- GROUP BY month, year
-- ORDER BY year DESC, month DESC;
