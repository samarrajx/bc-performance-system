"use client";

import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";
import ErrorPanel from "@/components/ui/ErrorPanel";
import {
  DAILY_REQUIRED_HEADERS,
  validateRows,
  normalizeRow,
} from "@/lib/daily/validation";

export default function DailyUploadPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);

  // ============================================================
  // HEADER VALIDATION
  // ============================================================
  const validateHeaders = (headers: string[]) => {
    if (JSON.stringify(headers) !== JSON.stringify(DAILY_REQUIRED_HEADERS)) {
      setMessage({ type: "error", text: "Invalid Daily file format. Download latest template." });
      return false;
    }
    return true;
  };

  // ============================================================
  // CHECK FOR EXISTING DATA (FOR REPLACE CONFIRMATION)
  // ============================================================
  const checkExistingData = async (date: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("daily_performance")
      .select("id")
      .eq("date", date)
      .limit(1);

    if (error) {
      console.error("Error checking existing data:", error);
      return false;
    }

    return data && data.length > 0;
  };

  // ============================================================
  // FILE UPLOAD HANDLER
  // ============================================================
  const handleFile = async (file: File) => {
    if (!selectedDate) {
      setMessage({ type: "error", text: "Please select a date first." });
      return;
    }

    setLoading(true);
    setMessage(null);
    setErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Ensure all fields are read as strings to preserve leading zeros
      complete: async function (results: Papa.ParseResult<any>) {
        try {
          // Step 1: Validate headers
          const headers = results.meta.fields || [];
          if (!validateHeaders(headers)) {
            setLoading(false);
            return;
          }

          const rawData = results.data as any[];

          // Step 2: Validate rows
          const rowValidation = validateRows(rawData);
          if (!rowValidation.valid) {
            setErrors(rowValidation.errors);
            setMessage({ type: "error", text: "Validation failed. Check errors below." });
            setLoading(false);
            return;
          }

          // Step 3: Check for existing data and confirm replace
          const hasExistingData = await checkExistingData(selectedDate);
          if (hasExistingData) {
            const confirmReplace = confirm(
              `Performance data already exists for ${selectedDate}.\n\nThis will REPLACE all existing records for this date.\n\nContinue?`
            );
            if (!confirmReplace) {
              setLoading(false);
              return;
            }
          }

          // Step 4: Normalize data (convert blank numerics to 0)
          const normalizedData = rawData.map(normalizeRow);

          // Step 5: Call RPC function
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            "daily_upload",
            {
              performance_data: normalizedData,
              upload_date: selectedDate,
            }
          );

          if (rpcError) {
            setMessage({ type: "error", text: `Upload failed: ${rpcError.message}` });
            setLoading(false);
            return;
          }

          // Step 6: Show success message
          setMessage({
            type: "success",
            text: `Upload Successful! Date: ${rpcResult.upload_date}, Rows Processed: ${rpcResult.inserted_rows}, New Devices Created: ${rpcResult.created_devices}`
          });

          setLoading(false);
        } catch (err: any) {
          setMessage({ type: "error", text: `Unexpected error: ${err.message}` });
          setLoading(false);
        }
      },
      error: function (error: any) {
        setMessage({ type: "error", text: `CSV parsing error: ${error.message}` });
        setLoading(false);
      },
    });
  };

  // ============================================================
  // TEMPLATE DOWNLOAD
  // ============================================================
  const downloadTemplate = () => {
    const csv = DAILY_REQUIRED_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daily_template.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // UI RENDER
  // ============================================================
  return (
    <div className="max-w-4xl">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Daily Performance Upload
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Upload daily performance data for all agents
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl">
        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Performance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 disabled:opacity-50"
          />
        </div>

        {/* Template Download */}
        <div className="mb-8">
          <button
            onClick={downloadTemplate}
            disabled={loading}
            className="px-6 py-3 bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-xl">📥</span>
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Upload Performance File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files) {
                handleFile(e.target.files[0]);
              }
            }}
            disabled={loading}
            className="w-full px-4 py-8 border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 focus:outline-none focus:border-emerald-500 transition-all bg-white/30 dark:bg-black/20 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 text-center"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium text-center">
            Accepted format: CSV file only
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-10 glass-panel rounded-2xl mb-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Processing upload...</p>
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
              <span className="text-xl">{message.type === "success" ? "✅" : "⚠️"}</span>
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          </div>
        )}

        <ErrorPanel errors={errors} className="mt-6" />
      </div>
    </div>
  );
}
