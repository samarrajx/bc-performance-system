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

          // Convert date to ISO before sending to RPC
          const cleanedData = rawData.map((row) => {
            const [day, month, year] = row["DATE OF JOINING"].split("-");
            return {
              ...row,
              "DATE OF JOINING": `${year}-${month}-${day}`,
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
          Master Sync
        </h1>
        <p className="text-gray-600">
          Synchronize agent and device master data
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Sync Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "incremental"}
                onChange={() => setMode("incremental")}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-gray-700 font-medium">Incremental Mode</span>
              <span className="text-sm text-gray-500">(Add/Update only)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "full"}
                onChange={() => setMode("full")}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-gray-700 font-medium">Full Sync Mode</span>
              <span className="text-sm text-gray-500">(Deactivates missing agents)</span>
            </label>
          </div>
        </div>

        {/* Template Download */}
        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>📥</span>
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload Master Data File
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
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 focus:outline-none focus:border-pink-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 mt-2">
            Accepted format: CSV file only
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Processing sync...</p>
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

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> {mode === "incremental"
              ? "Incremental mode will add new entries and update existing ones without deactivating any agents."
              : "Full sync mode will mark agents not in the uploaded file as inactive."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
