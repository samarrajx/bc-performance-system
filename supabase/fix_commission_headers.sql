-- FIX DUPLICATE CSV HEADER MAPPINGS for Account Opening Commissions
-- In the original layout, non-funded, funded, and total commissions all used 'COMM_ACCT_OPN'.
-- This causes the upload tool to overwrite/duplicate whichever value it finds.
-- We must assign unique headers to each to capture them correctly.

-- Assuming your actual CSV will have distinct headers for these. 
-- Example generic updates (You might need to adjust 'NON_FUNDED_COMM_ACCT_OPN' etc to match your actual CSV columns exactly):

UPDATE commission_column_settings
SET csv_header_name = 'NON_FUNDED_COMM_ACCT_OPN'
WHERE column_key = 'non_funded_account_open_comm';

UPDATE commission_column_settings
SET csv_header_name = 'FUNDED_COMM_ACCT_OPN'
WHERE column_key = 'funded_account_open_comm';

-- Usually 'total' is a derived value, but if the CSV provides it:
UPDATE commission_column_settings
SET csv_header_name = 'TOTAL_COMM_ACCT_OPN'
WHERE column_key = 'total_account_open_comm';

-- Verify the changes
SELECT column_key, csv_header_name 
FROM commission_column_settings 
WHERE column_key LIKE '%account_open_comm';
