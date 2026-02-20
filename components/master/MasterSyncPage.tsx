"use client";

import { useState } from "react";
import Papa from "papaparse";
import { REQUIRED_HEADERS } from "@/lib/master/validation";
import { supabase } from "@/lib/supabaseClient";

export default function MasterSyncPage() {
  const [mode, setMode] = useState<"incremental" | "full">("incremental");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---------------- HEADER VALIDATION ----------------
  const validateHeaders = (headers: string[]) => {
    if (JSON.stringify(headers) !== JSON.stringify(REQUIRED_HEADERS)) {
      setMessage({ type: "error", text: "Invalid header format. Download latest template." });
      return false;
    }
    return true;
  };

  // ---------------- ROW VALIDATION ----------------
  const validateRows = (rows: any[]) => {
    const agentIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      if (
        !row["Agent id"] ||
        !row["Agent Name"] ||
        !row["DATE OF JOINING"] ||
        !row["DLM_DeviceId"]
      ) {
        return {
          valid: false,
          message: `Missing required field at row ${rowNumber}`,
        };
      }

      if (agentIds.has(row["Agent id"])) {
        return {
          valid: false,
          message: `Duplicate Agent id at row ${rowNumber}`,
        };
      }

      agentIds.add(row["Agent id"]);

      // Validate date format DD-MM-YYYY
      const parts = row["DATE OF JOINING"].split("-");
      if (parts.length !== 3) {
        return {
          valid: false,
          message: `Invalid DATE OF JOINING at row ${rowNumber}`,
        };
      }

      const [day, month, year] = parts;
      const isoDate = `${year}-${month}-${day}`;
      const testDate = new Date(isoDate);

      if (isNaN(testDate.getTime())) {
        return {
          valid: false,
          message: `Invalid DATE OF JOINING at row ${rowNumber}`,
        };
      }
    }

    return { valid: true };
  };

  // ---------------- FILE HANDLER ----------------
  const handleFile = async (file: File) => {
    setLoading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Ensure all fields are read as strings to preserve leading zeros
      complete: async function (results) {
        try {
          const headers = results.meta.fields || [];
          if (!validateHeaders(headers)) {
            setLoading(false);
            return;
          }

          const rawData = results.data as any[];

          const rowValidation = validateRows(rawData);
          if (!rowValidation.valid) {
            setMessage({ type: "error", text: rowValidation.message || "Row validation failed" });
            setLoading(false);
            return;
          }

          // Convert date to ISO before sending to RPC AND Normalize Device ID
          const cleanedData = rawData.map((row) => {
            const [day, month, year] = row["DATE OF JOINING"].split("-");

            // Normalize Device ID (add leading zero if length is 9)
            let deviceId = row["DLM_DeviceId"]?.toString().trim() || "";
            if (deviceId.length === 9) {
              deviceId = "0" + deviceId;
            }

            return {
              ...row,
              "DATE OF JOINING": `${year}-${month}-${day}`,
              "DLM_DeviceId": deviceId,
              // Map additional fields for Devices table
              "branch_name": row["BRANCH NAME"],
              "district": row["District"],
              "state": row["State"],
              "region": row["Region"]
            };
          });

          if (mode === "full") {
            const confirmFull = confirm(
              "Full Sync will deactivate agents not in this file. Continue?"
            );
            if (!confirmFull) {
              setLoading(false);
              return;
            }
          }

          const { data: rpcResult, error } = await supabase.rpc(
            "master_sync",
            {
              master_data: cleanedData,
              sync_mode: mode,
            }
          );

          if (error) {
            setMessage({ type: "error", text: `Upload failed: ${error.message}` });
            setLoading(false);
            return;
          }

          setMessage({
            type: "success",
            text: `Upload Success! Added Agents: ${rpcResult.added_agents}, Updated Agents: ${rpcResult.updated_agents}. Syncing Auth Users...`
          });

          // ---------------- STEP 2 (NEW): Sync Auth Users ----------------
          try {
            // We need to send the list of Agent IDs to the API
            // Since RPC doesn't return the IDs, we use the input data
            const agentList = cleanedData.map((row: any) => ({
              agent_id: row["Agent id"]
            }));

            const authResponse = await fetch('/api/admin/sync-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agents: agentList }),
            });

            const authResult = await authResponse.json();

            if (authResponse.ok) {
              setMessage({
                type: "success",
                text: `Success! DB Sync: ${rpcResult.added_agents} added. Auth Sync: ${authResult.results.created} created, ${authResult.results.existing} existing.`
              });
            } else {
              setMessage({
                type: "error",
                text: `DB Sync success, but Auth Sync failed: ${authResult.error}`
              });
            }

          } catch (authErr) {
            console.error("Auth Sync Error", authErr);
            setMessage({
              type: "error",
              text: `DB Sync success, but Auth Sync error. Check console.`
            });
          }

          setLoading(false);
        } catch (err: any) {
          setMessage({ type: "error", text: `Unexpected error: ${err.message}` });
          setLoading(false);
        }
      },
    });
  };

  // ---------------- TEMPLATE DOWNLOAD ----------------
  const downloadTemplate = () => {
    const csv = REQUIRED_HEADERS.join(",");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "master_template.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Master Sync
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Synchronize agent and device master data
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl mb-8">
        {/* Mode Selection */}
        <div className="mb-8 p-6 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10">
          <label className="block text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 tracking-tight uppercase">
            Sync Mode
          </label>
          <div className="flex flex-col sm:flex-row gap-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="radio"
                  checked={mode === "incremental"}
                  onChange={() => setMode("incremental")}
                  className="w-5 h-5 text-emerald-500 focus:ring-emerald-500/50 bg-white/50 dark:bg-black/50 border border-white/30 dark:border-white/20 cursor-pointer shadow-inner transition-all appearance-none rounded-full checked:border-emerald-500 checked:bg-emerald-500"
                />
                {mode === "incremental" && <div className="absolute w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <div>
                <span className="block text-slate-800 dark:text-slate-200 font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Incremental Mode</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400 font-medium">(Add/Update only)</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="radio"
                  checked={mode === "full"}
                  onChange={() => setMode("full")}
                  className="w-5 h-5 text-emerald-500 focus:ring-emerald-500/50 bg-white/50 dark:bg-black/50 border border-white/30 dark:border-white/20 cursor-pointer shadow-inner transition-all appearance-none rounded-full checked:border-emerald-500 checked:bg-emerald-500"
                />
                {mode === "full" && <div className="absolute w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <div>
                <span className="block text-slate-800 dark:text-slate-200 font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Full Sync Mode</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400 font-medium">(Deactivates missing agents)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Template Download */}
        <div className="mb-8">
          <button
            onClick={downloadTemplate}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Upload Master Data File
          </label>
          <div className="relative group">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className="w-full px-6 py-12 border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/40 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                Drop CSV file here or click to browse
              </p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Accepted format: CSV file only
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-10 glass-panel rounded-2xl mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Processing upload. This may take a few moments...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-2xl border mb-6 ${message.type === "success"
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

        {/* Info Box */}
        <div className="glass-panel border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <span>
              <strong className="text-slate-900 dark:text-white block mb-1">Note</strong>
              {mode === "incremental"
                ? "Incremental mode will add new entries and update existing ones without deactivating any agents."
                : "Full sync mode will mark agents not in the uploaded file as inactive."
              }
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
