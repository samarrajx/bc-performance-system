export const DAILY_REQUIRED_HEADERS = [
  "State",
  "Zone",
  "Sol_Id",
  "Deviceid",
  "BC_Agent_Name",
  "OD_Account_Number",
  "Deposit_Txn_Count",
  "Deposit_Txn_Amount",
  "Withdrawal_Txn_Count",
  "Withdrawal_Txn_Amount",
  "AEPS_Onus_Count",
  "AEPS_Onus_Amt",
  "AEPS_Offus_Count",
  "AEPS_Offus_Amt",
  "Rupay_Card_Count",
  "Rupay_Card_Amount",
  "Other_Card_Count",
  "Other_Card_Amount",
  "Remittance_Count",
  "Remittance_Amt",
  "Enrollment_Count",
  "PMJBY_Count",
  "PMSBY_Count",
  "APY_Count",
  "Onlineaccount count",
  "BCname",
];

// Numeric field names that need validation
const NUMERIC_FIELDS = [
  "Deposit_Txn_Count",
  "Deposit_Txn_Amount",
  "Withdrawal_Txn_Count",
  "Withdrawal_Txn_Amount",
  "AEPS_Onus_Count",
  "AEPS_Onus_Amt",
  "AEPS_Offus_Count",
  "AEPS_Offus_Amt",
  "Rupay_Card_Count",
  "Rupay_Card_Amount",
  "Other_Card_Count",
  "Other_Card_Amount",
  "Remittance_Count",
  "Remittance_Amt",
  "Enrollment_Count",
  "PMJBY_Count",
  "PMSBY_Count",
  "APY_Count",
  "Onlineaccount count",
];

/**
 * Validates all rows for required fields and data integrity
 */
/**
 * Validates all rows for required fields and data integrity
 */
export const validateRows = (rows: any[]) => {
  const deviceIds = new Set<string>();
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Account for header row

    // Check required field: Deviceid
    if (!row["Deviceid"] || row["Deviceid"].trim() === "") {
      errors.push({
        row: rowNumber,
        message: "Missing Deviceid",
      });
      continue;
    }

    // Check for duplicate Deviceid within file
    const deviceId = row["Deviceid"].trim();
    if (deviceIds.has(deviceId)) {
      errors.push({
        row: rowNumber,
        message: `Duplicate Deviceid "${deviceId}"`,
      });
    } else {
      deviceIds.add(deviceId);
    }

    // Validate numeric fields
    const numericErrors = validateNumericFields(row, rowNumber);
    if (numericErrors.length > 0) {
      errors.push(...numericErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates that all numeric fields contain valid numbers or are blank
 */
const validateNumericFields = (row: any, rowNumber: number) => {
  const errors: { row: number; message: string }[] = [];

  for (const field of NUMERIC_FIELDS) {
    const value = row[field];

    // Skip if blank (will be converted to 0)
    if (!value || value.trim() === "") {
      continue;
    }

    // Check if valid number
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push({
        row: rowNumber,
        message: `Invalid numeric value "${value}" in field "${field}"`,
      });
      continue;
    }

    // Check for negative values (business rule: counts/amounts should be non-negative)
    if (numValue < 0) {
      errors.push({
        row: rowNumber,
        message: `Negative value not allowed in field "${field}"`,
      });
    }
  }

  return errors;
};

/**
 * Normalizes a row by converting blank numeric fields to "0"
 * and stripping leading apostrophes (Excel text format marker)
 * This prepares the data for backend processing
 */
export const normalizeRow = (row: any) => {
  const normalized: any = {};

  // Strip leading apostrophes from ALL fields and normalize numerics
  for (const key in row) {
    let value = row[key];

    // Strip leading apostrophe if present (Excel text format marker)
    if (typeof value === 'string' && value.startsWith("'")) {
      value = value.substring(1);
    }

    // Convert blank numeric fields to "0"
    if (NUMERIC_FIELDS.includes(key)) {
      if (!value || value.trim() === "") {
        normalized[key] = "0";
      } else {
        normalized[key] = value;
      }
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
};

