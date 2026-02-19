"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
    const [agentId, setAgentId] = useState("");
    const [agentName, setAgentName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleVerify = async () => {
        if (!agentId) return;
        setLoading(true);
        setMessage(null);
        setAgentName(null);

        try {
            const { data, error } = await supabase
                .from("agents")
                .select("agent_name")
                .eq("agent_id", agentId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setAgentName(data.agent_name);
                setMessage({ type: "success", text: "Agent verified successfully." });
            } else {
                setMessage({ type: "error", text: "Agent ID not found." });
            }
        } catch (error: any) {
            setMessage({ type: "error", text: `Verification failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!agentId) return;
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Reset failed");
            }

            setMessage({ type: "success", text: `Password reset to default (uco@rcds). Agent must change it on next login.` });
            setAgentId("");
            setAgentName(null);
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    Agent Password Reset
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Reset an agent's password to the default <strong>uco@rcds</strong>.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Agent ID
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={agentId}
                            onChange={(e) => {
                                setAgentId(e.target.value);
                                setAgentName(null);
                                setMessage(null);
                            }}
                            placeholder="e.g., 1001"
                            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={loading || !agentId}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            Verify
                        </button>
                    </div>
                </div>

                {agentName && (
                    <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-800 dark:text-green-300 font-medium">Agent Name</p>
                            <p className="text-xl font-bold text-green-900 dark:text-green-100">{agentName}</p>
                        </div>
                        <div className="text-3xl">👤</div>
                    </div>
                )}

                {agentName && (
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                        <span>🔄</span>
                        <span>Reset Password to Default</span>
                    </button>
                )}

                {/* Messages */}
                {message && (
                    <div
                        className={`mt-6 p-4 rounded-lg border ${message.type === "success"
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">{message.type === "success" ? "✓" : "⚠"}</span>
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
