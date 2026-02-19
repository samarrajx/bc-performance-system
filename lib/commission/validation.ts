/**
 * Commission Upload Validation
 * 
 * Handles strict validation for commission Excel/CSV uploads.
 * Key features:
 * - Trims all headers (Excel adds spaces like "AGENT ID ")
 * - Validates NET COMMISSION = BC_COMM + CORP_COMM
 * - Calculates TDS in application layer (NOT in SQL)
 * - Checks for duplicate agents in file
 * - Verifies agent_id exists in system
 */

// Required headers (will be trimmed before validation)
export const COMMISSION_REQUIRED_HEADERS = [
    "AGENT ID",      // Note: Excel has "AGENT ID " with trailing space
    "BC_COMM",
    "CORP_COMM",
    "NET COMMISSION" // Note: Excel has " NET COMMISSION " with spaces
];

export const DEFAULT_TDS_PERCENT = 2.00;

/**
 * Trim all column headers
 * Excel files often have trailing/leading spaces
 */
export const trimHeaders = (headers: string[]): string[] => {
    return headers.map(h => (h || "").toString().trim());
};

/**
 * Validate that all required headers exist
 */
export const validateHeaders = (headers: string[]): { valid: boolean; errors: string[] } => {
    const trimmed = trimHeaders(headers);
    const errors: string[] = [];

    COMMISSION_REQUIRED_HEADERS.forEach(required => {
        if (!trimmed.includes(required)) {
            errors.push(`Missing required header: "${required}"`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Validate and process a single row
 * - Validates agent ID exists
 * - Validates numeric fields
 * - Verifies NET COMMISSION = BC_COMM + CORP_COMM
 * - Calculates TDS and net payable
 */
export const validateAndProcessRow = (
    row: any,
    rowIndex: number,
    validAgents: Set<string>
): { valid: boolean; processed?: any; errors: string[] } => {
    const errors: string[] = [];

    // Extract and trim values
    const agentId = (row["AGENT ID"] || "").toString().trim();
    const bcCommStr = (row["BC_COMM"] || "0").toString().trim();
    const corpCommStr = (row["CORP_COMM"] || "0").toString().trim();
    const netCommissionStr = (row["NET COMMISSION"] || "0").toString().trim();

    // Parse numeric values
    const bcComm = parseFloat(bcCommStr) || 0;
    const corpComm = parseFloat(corpCommStr) || 0;
    const netCommission = parseFloat(netCommissionStr) || 0;

    // Validation rules
    if (!agentId) {
        errors.push(`Row ${rowIndex + 1}: Missing AGENT ID`);
    } else if (!validAgents.has(agentId)) {
        errors.push(`Row ${rowIndex + 1}: Agent ID "${agentId}" does not exist in system`);
    }

    if (isNaN(bcComm)) {
        errors.push(`Row ${rowIndex + 1}: Invalid BC_COMM value: "${bcCommStr}"`);
    }

    if (isNaN(corpComm)) {
        errors.push(`Row ${rowIndex + 1}: Invalid CORP_COMM value: "${corpCommStr}"`);
    }

    if (isNaN(netCommission)) {
        errors.push(`Row ${rowIndex + 1}: Invalid NET COMMISSION value: "${netCommissionStr}"`);
    }

    // Validate NET COMMISSION formula: must equal BC_COMM + CORP_COMM
    const calculated = bcComm + corpComm;
    const tolerance = 0.01; // Allow 1 paisa difference due to rounding

    if (Math.abs(calculated - netCommission) > tolerance) {
        errors.push(
            `Row ${rowIndex + 1}: NET COMMISSION mismatch. ` +
            `Expected ${calculated.toFixed(2)} (BC_COMM + CORP_COMM), ` +
            `got ${netCommission.toFixed(2)}`
        );
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Calculate TDS in application layer (NOT in SQL)
    const tdsPercent = DEFAULT_TDS_PERCENT;
    const tdsAmount = parseFloat((bcComm * (tdsPercent / 100)).toFixed(2));
    const agentNetPayable = parseFloat((bcComm - tdsAmount).toFixed(2));

    return {
        valid: true,
        processed: {
            agent_id: agentId,

            // Agent details
            state_name: row["STATE_NAME"] || null,
            zone_name: row["ZONE_NAME"] || null,
            district: row["DIST"] || null,
            mandal: row["Mandal"] || null,
            base_branch: row["BASE_BRANCH"] || null,
            sol_id: row["SOL_ID"] || null,
            village_name: row["VILLAGE_NAME"] || null,
            bca_name: row["BCA_NAME"] || null,
            agent_id_bank: row["AGENT ID BANK"] || null,
            settlement_account: row["SETT_ACCNO"] || null,
            date_of_joining: row["DATE OF JOINING"] || null,
            device_id: row["Device ID"] || null,
            company_name: row["Company Name"] || null,
            location_type: row["Location Type"] || null,

            // Account Opening Details
            non_funded_account_open_count: parseInt(row["NON FUNDED_NO_OF_ACCT_OPN"] || "0") || 0,
            non_funded_account_open_comm: parseFloat(row["COMM_ACCT_OPN"] || "0") || 0,
            funded_account_open_count: parseInt(row["FUNDED_NO_OF_ACCT_OPN"] || "0") || 0,
            funded_account_open_comm: parseFloat(row["COMM_ACCT_OPN"] || "0") || 0,  // Note: CSV has duplicate "COMM_ACCT_OPN" headers
            total_account_open_count: parseInt(row["TOTAL_NO_OF_ACCT_OPN"] || "0") || 0,
            total_account_open_comm: parseFloat(row["COMM_ACCT_OPN"] || "0") || 0,

            // Financial Transactions
            financial_txn_count: parseInt(row["FINANCIAL_TXN"] || "0") || 0,
            financial_txn_amount: parseFloat(row["TXN_AMT"] || "0") || 0,
            financial_txn_comm: parseFloat(row[" TXN_COMM "] || row["TXN_COMM"] || "0") || 0,

            // Remittance
            remittance_count: parseInt(row["Remmittance count"] || "0") || 0,
            remittance_comm: parseFloat(row["remmittance/Rs10"] || "0") || 0,

            // Login Activity
            login_days: parseInt(row["Login days"] || "0") || 0,
            fixed_commission: parseFloat(row["fixd commission"] || "0") || 0,

            // Government Schemes
            apy_count: parseInt(row["APY COUNT"] || "0") || 0,
            apy_comm: parseFloat(row["APY COMM"] || "0") || 0,
            pmsby_count: parseInt(row["SBY COUNT"] || "0") || 0,
            pmsby_comm: parseFloat(row["SBY COMM"] || "0") || 0,
            pmjby_count: parseInt(row["JBY COUNT"] || "0") || 0,
            pmjby_comm: parseFloat(row["JBY COMM"] || "0") || 0,

            // Incentives
            sss_incentive: parseFloat(row["10 % INCENTIVE for SSS"] || "0") || 0,

            // Re-KYC
            rekyc_count: parseInt(row["Re-KYC Count"] || "0") || 0,
            rekyc_comm: parseFloat(row["Re-KYC Comm"] || "0") || 0,

            // Final Commission
            net_commission: netCommission,
            bc_comm: bcComm,
            corp_comm: corpComm,

            // TDS (calculated in app layer)
            tds_percent: tdsPercent,
            tds_amount: tdsAmount,
            agent_net_payable: agentNetPayable
        },
        errors: []
    };
};

/**
 * Check for duplicate agent IDs within the file
 * Each agent should appear only once per upload
 */
export const checkDuplicateAgents = (rows: any[]): string[] => {
    const seen = new Map<string, number>(); // agent_id -> first row number
    const errors: string[] = [];

    rows.forEach((row, index) => {
        const agentId = (row["AGENT ID"] || "").toString().trim();

        if (!agentId) return; // Skip empty agent IDs (will be caught by row validation)

        if (seen.has(agentId)) {
            errors.push(
                `Duplicate AGENT ID "${agentId}" found at rows ${seen.get(agentId)! + 1} and ${index + 1}`
            );
        } else {
            seen.set(agentId, index);
        }
    });

    return errors;
};

/**
 * Normalize row data (convert empty strings to '0' for numeric fields)
 */
export const normalizeRow = (row: any) => {
    const normalized: any = {};

    for (const key in row) {
        const trimmedKey = key.trim();
        let value = row[key];

        // Convert empty numeric fields to '0'
        if (['BC_COMM', 'CORP_COMM', 'NET COMMISSION'].includes(trimmedKey)) {
            if (!value || value.toString().trim() === '') {
                value = '0';
            }
        }

        normalized[trimmedKey] = value;
    }

    return normalized;
};
