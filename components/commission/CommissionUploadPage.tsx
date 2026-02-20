"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";
import {
    fetchColumnSettings,
    validateHeadersDynamic,
    validateAndProcessRowDynamic,
    checkDuplicateAgents,
    normalizeRow,
    type ColumnSetting
} from "@/lib/commission/validation-dynamic";
import AdminLayout from "@/components/layout/AdminLayout";
import ErrorPanel from "@/components/ui/ErrorPanel";

export default function CommissionUploadPage() {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [errors, setErrors] = useState<{ row?: number; message: string }[]>([]);

    /**
     * Check if commission data already exists for the selected month/year
     */
    const checkExistingData = async (month: number, year: number): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from("commissions")
                .select("id")
                .eq("month", month)
                .eq("year", year)
                .limit(1);

            if (error) throw error;
            return (data?.length || 0) > 0;
        } catch (error: any) {
            console.error("Error checking existing data:", error);
            return false;
        }
    };

    /**
     * Fetch all valid agent IDs from the system
     */
    const fetchValidAgents = async (): Promise<Set<string>> => {
        try {
            const { data, error } = await supabase
                .from("agents")
                .select("agent_id");

            if (error) throw error;

            return new Set(data?.map((a: any) => a.agent_id.trim()) || []);
        } catch (error: any) {
            console.error("Error fetching agents:", error);
            throw new Error("Failed to fetch agent list from database");
        }
    };

    /**
     * Handle file upload
     */
    const handleFile = async (file: File) => {
        if (!selectedMonth || !selectedYear) {
            setMessage({ type: "error", text: "Please select month and year first" });
            return;
        }

        const month = parseInt(selectedMonth);
        const year = parseInt(selectedYear);

        if (month < 1 || month > 12) {
            setMessage({ type: "error", text: "Invalid month selected" });
            return;
        }

        if (year < 2020) {
            setMessage({ type: "error", text: "Year must be 2020 or later" });
            return;
        }

        setLoading(true);
        setMessage(null);
        setErrors([]);

        try {
            // Step 1: Fetch column settings from database
            const columnSettings = await fetchColumnSettings();

            if (columnSettings.length === 0) {
                setMessage({
                    type: "error",
                    text: "No active column settings found. Please configure columns in Column Settings page first."
                });
                setLoading(false);
                return;
            }

            // Step 2: Read file
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // --- Custom Excel Parsing for Duplicate Headers ---
            const rawArrayData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

            if (!rawArrayData || rawArrayData.length < 2) {
                setMessage({ type: "error", text: "File is empty or invalid" });
                setLoading(false);
                return;
            }

            let commAcctOpnCount = 0;
            const processedHeaders = (rawArrayData[0] || []).map(h => {
                const trimmed = String(h || "").trim();
                if (trimmed === 'COMM_ACCT_OPN') {
                    commAcctOpnCount++;
                    if (commAcctOpnCount === 1) return 'NON_FUNDED_COMM_ACCT_OPN';
                    if (commAcctOpnCount === 2) return 'FUNDED_COMM_ACCT_OPN';
                    if (commAcctOpnCount === 3) return 'TOTAL_COMM_ACCT_OPN';
                }
                return trimmed;
            });

            const rawData: any[] = [];
            for (let i = 1; i < rawArrayData.length; i++) {
                const rowArr = rawArrayData[i];
                if (!rowArr || rowArr.length === 0) continue;

                const rowObj: any = {};
                processedHeaders.forEach((header, index) => {
                    rowObj[header] = rowArr[index];
                });
                rawData.push(rowObj);
            }

            if (!rawData || rawData.length === 0) {
                setMessage({ type: "error", text: "File has no valid data rows" });
                setLoading(false);
                return;
            }

            // Step 3: Validate headers dynamically based on column settings
            const headers = Object.keys(rawData[0] as object);
            const headerValidation = validateHeadersDynamic(headers, columnSettings);

            if (!headerValidation.valid) {
                setErrors(headerValidation.errors);
                setMessage({ type: "error", text: "Header validation failed" });
                setLoading(false);
                return;
            }

            // Step 4: Normalize rows (trim headers)
            const normalizedData = rawData.map(normalizeRow);

            // Step 5: Check for duplicate agents
            const duplicateErrors = checkDuplicateAgents(normalizedData);
            if (duplicateErrors.length > 0) {
                setErrors(duplicateErrors);
                setMessage({ type: "error", text: "Duplicate agents found" });
                setLoading(false);
                return;
            }

            // Step 6: Fetch valid agents from database
            const validAgents = await fetchValidAgents();

            // Step 7: Validate and process each row using dynamic mapping
            const processedRows: any[] = [];
            const allErrors: { row: number; message: string }[] = [];

            for (let i = 0; i < normalizedData.length; i++) {
                const result = validateAndProcessRowDynamic(
                    normalizedData[i],
                    i,
                    columnSettings,
                    validAgents
                );

                if (!result.valid) {
                    allErrors.push(...result.errors.map(e => ({ row: i + 2, message: e.message })));
                } else if (result.processed) {
                    processedRows.push(result.processed);
                }
            }

            if (allErrors.length > 0) {
                setErrors(allErrors);
                setMessage({ type: "error", text: "Row validation failed. See errors below." });
                setLoading(false);
                return;
            }

            // Step 7: Check for existing data and confirm replacement
            const exists = await checkExistingData(month, year);
            if (exists) {
                // Determine month name for confirmation message
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const monthName = months[month - 1] || '';

                const confirmed = window.confirm(
                    `Commission data already exists for ${monthName} ${year}.\n\n` +
                    `This will DELETE all existing records for this month and replace with new data.\n\n` +
                    `Do you want to proceed?`
                );

                if (!confirmed) {
                    setLoading(false);
                    return;
                }
            }

            // Step 8: Call RPC function to upload
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
                "commission_upload",
                {
                    commission_data: processedRows,
                    upload_month: month,
                    upload_year: year
                }
            );

            if (rpcError) {
                throw rpcError;
            }

            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = months[month - 1] || '';

            setMessage({
                type: "success",
                text: `Successfully uploaded ${rpcResult.inserted_count} commission records for ${monthName} ${year}`
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage({
                type: "error",
                text: `Upload failed: ${error.message || "Unknown error"}`
            });
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (month: number): string => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1] || '';
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="mb-8 max-w-2xl flex justify-between items-start w-full">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                            Commission Upload
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Upload and process commission data for agents
                        </p>
                    </div>
                    <a
                        href="/sample_commission.csv"
                        download
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Sample
                    </a>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                    {/* Month and Year Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Select Month
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 disabled:opacity-50"
                                disabled={loading}
                            >
                                <option value="" className="dark:bg-slate-900">Choose a month</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m} className="dark:bg-slate-900">{getMonthName(m)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Select Year
                            </label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                min="2020"
                                max="2100"
                                placeholder="e.g., 2024"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 disabled:opacity-50 placeholder-slate-400"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Upload Commission File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFile(file);
                                }}
                                disabled={loading || !selectedMonth || !selectedYear}
                                className="w-full px-4 py-8 border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 focus:outline-none focus:border-emerald-500 transition-all bg-white/30 dark:bg-black/20 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 text-center"
                            />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium text-center">
                            Supported formats: .xlsx, .xls, .csv
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-10 glass-panel rounded-2xl mb-6">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Processing your file...</p>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {message && (
                        <div
                            className={`p-4 rounded-2xl border ${message.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">
                                    {message.type === "success" ? "✅" : "⚠️"}
                                </span>
                                <div className="flex-1">
                                    <p className="font-bold mb-1">
                                        {message.type === "success" ? "Success!" : "Error"}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap font-medium">{message.text}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <ErrorPanel errors={errors} className="mt-6" />
                </div>
            </div>
        </AdminLayout>
    );
}
