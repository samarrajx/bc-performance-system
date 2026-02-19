/**
 * Dynamic Commission Validation
 * 
 * Uses commission_column_settings table to dynamically:
 * - Validate required headers
 * - Map CSV headers to internal DB keys
 * - Build processed row data
 */

import { supabase } from "@/lib/supabaseClient";

export interface ColumnSetting {
    id: number;
    column_key: string;
    csv_header_name: string;
    is_required: boolean;
    is_active: boolean;
    display_order: number;
}

export const DEFAULT_TDS_PERCENT = 2.00;

/**
 * Fetch active column settings from database
 */
export const fetchColumnSettings = async (): Promise<ColumnSetting[]> => {
    const { data, error } = await supabase
        .from("commission_column_settings")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

    if (error) {
        throw new Error(`Failed to fetch column settings: ${error.message}`);
    }

    return data || [];
};

/**
 * Validate headers dynamically based on column settings
 */
/**
 * Validate headers dynamically based on column settings
 */
export const validateHeadersDynamic = (
    headers: string[],
    columnSettings: ColumnSetting[]
): { valid: boolean; errors: { message: string }[] } => {
    const trimmedHeaders = headers.map(h => (h || "").trim());
    const errors: { message: string }[] = [];

    // Always require AGENT ID
    if (!trimmedHeaders.includes("AGENT ID")) {
        errors.push({ message: 'Missing required header: "AGENT ID"' });
    }

    // Check all required columns from settings
    columnSettings.forEach(setting => {
        if (setting.is_required) {
            const trimmedCsvHeader = setting.csv_header_name.trim();

            if (!trimmedHeaders.includes(trimmedCsvHeader)) {
                errors.push({ message: `Missing required header: "${trimmedCsvHeader}"` });
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Map CSV row to internal DB structure using dynamic column settings
 */
export const mapRowDynamic = (
    row: any,
    columnSettings: ColumnSetting[]
): any => {
    const mapped: any = {};

    // Always extract agent_id
    const agentId = (row["AGENT ID"] || "").toString().trim();
    mapped.agent_id = agentId;

    // Map all active columns
    columnSettings.forEach(setting => {
        const csvHeader = setting.csv_header_name.trim();
        const columnKey = setting.column_key;
        const value = row[csvHeader];

        // Determine data type and convert
        if (columnKey.includes('_count') || columnKey === 'login_days') {
            // Integer fields
            mapped[columnKey] = parseInt(value || "0") || 0;
        } else if (
            columnKey.includes('_comm') ||
            columnKey.includes('_amount') ||
            columnKey === 'tds_percent' ||
            columnKey === 'tds_amount' ||
            columnKey === 'agent_net_payable' ||
            columnKey === 'sss_incentive' ||
            columnKey === 'fixed_commission'
        ) {
            // Numeric/decimal fields
            mapped[columnKey] = parseFloat(value || "0") || 0;
        } else {
            // Text fields
            mapped[columnKey] = value || null;
        }
    });

    return mapped;
};

/**
 * Validate and process row with NET COMMISSION check and TDS calculation
 */
export const validateAndProcessRowDynamic = (
    row: any,
    rowIndex: number,
    columnSettings: ColumnSetting[],
    validAgents: Set<string>
): { valid: boolean; processed?: any; errors: { message: string }[] } => {
    const errors: { message: string }[] = [];

    // Extract agent ID
    const agentId = (row["AGENT ID"] || "").toString().trim();

    if (!agentId) {
        errors.push({ message: "Missing AGENT ID" });
        return { valid: false, errors };
    }

    if (!validAgents.has(agentId)) {
        errors.push({ message: `Agent ID "${agentId}" does not exist in system` });
    }

    // Map row using column settings
    const mappedRow = mapRowDynamic(row, columnSettings);

    // Extract required financial fields
    const bcComm = mappedRow.bc_comm || 0;
    const corpComm = mappedRow.corp_comm || 0;
    const netCommission = mappedRow.net_commission || 0;

    // Validate NET COMMISSION formula
    const calculated = bcComm + corpComm;
    const tolerance = 0.01;

    if (Math.abs(calculated - netCommission) > tolerance) {
        errors.push({
            message: `NET COMMISSION mismatch. Expected ${calculated.toFixed(2)} (BC_COMM + CORP_COMM), got ${netCommission.toFixed(2)}`
        });
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Calculate TDS in application layer
    const tdsPercent = DEFAULT_TDS_PERCENT;
    const tdsAmount = parseFloat((bcComm * (tdsPercent / 100)).toFixed(2));
    const agentNetPayable = parseFloat((bcComm - tdsAmount).toFixed(2));

    // Add TDS fields
    mappedRow.tds_percent = tdsPercent;
    mappedRow.tds_amount = tdsAmount;
    mappedRow.agent_net_payable = agentNetPayable;

    return {
        valid: true,
        processed: mappedRow,
        errors: []
    };
};

/**
 * Check for duplicate agent IDs
 */
export const checkDuplicateAgents = (rows: any[]): { row: number, message: string }[] => {
    const seen = new Map<string, number>();
    const errors: { row: number, message: string }[] = [];

    rows.forEach((row, index) => {
        const agentId = (row["AGENT ID"] || "").toString().trim();

        if (!agentId) return;

        if (seen.has(agentId)) {
            errors.push({
                row: index + 1,
                message: `Duplicate AGENT ID "${agentId}" (also at row ${seen.get(agentId)! + 1})`
            });
        } else {
            seen.set(agentId, index);
        }
    });

    return errors;
};

/**
 * Normalize row (trim all headers)
 */
export const normalizeRow = (row: any) => {
    const normalized: any = {};

    for (const key in row) {
        const trimmedKey = key.trim();
        normalized[trimmedKey] = row[key];
    }

    return normalized;
};
