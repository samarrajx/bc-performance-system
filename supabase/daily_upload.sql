-- =====================================================
-- DAILY PERFORMANCE UPLOAD RPC FUNCTION
-- =====================================================
-- Purpose: Handle daily performance CSV uploads with:
--   - Skeleton device auto-creation
--   - Transactional integrity
--   - Duplicate date handling (UPSERT)
--   - Upload logging
-- =====================================================

CREATE OR REPLACE FUNCTION daily_upload(
  performance_data JSONB,
  upload_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_created_devices_count INTEGER := 0;
  v_row JSONB;
  v_device_id TEXT;
  v_unique_devices TEXT[];
BEGIN
  
  -- =====================================================
  -- STEP 1: Extract unique device IDs and create skeleton devices
  -- =====================================================
  
  SELECT ARRAY_AGG(DISTINCT elem->>'Deviceid')
  INTO v_unique_devices
  FROM jsonb_array_elements(performance_data) AS elem
  WHERE elem->>'Deviceid' IS NOT NULL AND elem->>'Deviceid' != '';
  
  -- Create skeleton devices for any device_id that doesn't exist
  IF v_unique_devices IS NOT NULL THEN
    INSERT INTO devices (device_id)
    SELECT unnest(v_unique_devices)
    ON CONFLICT (device_id) DO NOTHING;
    
    GET DIAGNOSTICS v_created_devices_count = ROW_COUNT;
  END IF;
  
  -- =====================================================
  -- STEP 2: Delete ALL existing records for this date (FULL REPLACE)
  -- =====================================================
  
  DELETE FROM daily_performance WHERE date = upload_date;
  
  -- =====================================================
  -- STEP 3: Insert new daily performance records
  -- =====================================================
  
  FOR v_row IN SELECT * FROM jsonb_array_elements(performance_data)
  LOOP
    v_device_id := v_row->>'Deviceid';
    
    -- Skip rows with empty device_id (should be caught by frontend validation)
    IF v_device_id IS NULL OR v_device_id = '' THEN
      CONTINUE;
    END IF;
    
    -- Insert new record
    INSERT INTO daily_performance (
      device_id,
      date,
      state,
      zone,
      sol_id,
      bc_agent_name,
      od_account_number,
      deposit_count,
      deposit_amount,
      withdrawal_count,
      withdrawal_amount,
      aeps_onus_count,
      aeps_onus_amt,
      aeps_offus_count,
      aeps_offus_amt,
      rupay_card_count,
      rupay_card_amount,
      other_card_count,
      other_card_amount,
      remittance_count,
      remittance_amt,
      enrollment_count,
      pmjby_count,
      pmsby_count,
      apy_count,
      online_account_count,
      bc_name
    ) VALUES (
      v_device_id,
      upload_date,
      v_row->>'State',
      v_row->>'Zone',
      v_row->>'Sol_Id',
      v_row->>'BC_Agent_Name',
      v_row->>'OD_Account_Number',
      COALESCE((v_row->>'Deposit_Txn_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Deposit_Txn_Amount')::NUMERIC, 0),
      COALESCE((v_row->>'Withdrawal_Txn_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Withdrawal_Txn_Amount')::NUMERIC, 0),
      COALESCE((v_row->>'AEPS_Onus_Count')::NUMERIC, 0),
      COALESCE((v_row->>'AEPS_Onus_Amt')::NUMERIC, 0),
      COALESCE((v_row->>'AEPS_Offus_Count')::NUMERIC, 0),
      COALESCE((v_row->>'AEPS_Offus_Amt')::NUMERIC, 0),
      COALESCE((v_row->>'Rupay_Card_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Rupay_Card_Amount')::NUMERIC, 0),
      COALESCE((v_row->>'Other_Card_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Other_Card_Amount')::NUMERIC, 0),
      COALESCE((v_row->>'Remittance_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Remittance_Amt')::NUMERIC, 0),
      COALESCE((v_row->>'Enrollment_Count')::NUMERIC, 0),
      COALESCE((v_row->>'PMJBY_Count')::NUMERIC, 0),
      COALESCE((v_row->>'PMSBY_Count')::NUMERIC, 0),
      COALESCE((v_row->>'APY_Count')::NUMERIC, 0),
      COALESCE((v_row->>'Onlineaccount count')::NUMERIC, 0),
      v_row->>'BCname'
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  -- =====================================================
  -- STEP 3: Log the upload
  -- =====================================================
  
  INSERT INTO upload_logs (
    file_type,
    file_name,
    upload_mode,
    rows_count,
    status
  ) VALUES (
    'DAILY_PERFORMANCE',
    'daily_' || upload_date::TEXT || '.csv',
    'REPLACE',
    v_inserted_count,
    'SUCCESS'
  );
  
  -- =====================================================
  -- STEP 4: Return summary
  -- =====================================================
  
  RETURN jsonb_build_object(
    'inserted_rows', v_inserted_count,
    'created_devices', v_created_devices_count,
    'upload_date', upload_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed upload
    INSERT INTO upload_logs (
      file_type,
      file_name,
      upload_mode,
      rows_count,
      status,
      error_message
    ) VALUES (
      'DAILY_PERFORMANCE',
      'daily_' || upload_date::TEXT || '.csv',
      'REPLACE',
      0,
      'FAILED',
      SQLERRM
    );
    
    -- Re-raise the error to rollback transaction
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION daily_upload(JSONB, DATE) TO authenticated;

-- =====================================================
-- USAGE EXAMPLE:
-- =====================================================
-- SELECT daily_upload(
--   '[
--     {"Deviceid": "DEV001", "State": "Karnataka", "Deposit_Txn_Count": "10", ...},
--     {"Deviceid": "DEV002", "State": "Karnataka", "Deposit_Txn_Count": "5", ...}
--   ]'::jsonb,
--   '2026-02-17'::date
-- );
