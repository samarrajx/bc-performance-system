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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Daily Performance Upload
        </h1>
        <p className="text-gray-600">
          Upload daily performance data for all agents
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Performance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:opacity-50"
          />
        </div>

        {/* Template Download */}
        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>📥</span>
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 focus:outline-none focus:border-teal-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 mt-2">
            Accepted format: CSV file only
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Processing upload...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
              }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{message.type === "success" ? "✓" : "⚠"}</span>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        )}

        <ErrorPanel errors={errors} className="mt-6" />
      </div>
    </div>
  );
}
