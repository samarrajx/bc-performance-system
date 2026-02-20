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
            <div className="mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    Agent Password Reset
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Reset an agent's password to the default <strong className="text-slate-700 dark:text-slate-300">uco@rcds</strong>.
                </p>
            </div>

            <div className="glass-panel rounded-3xl p-8 border-white/20 dark:border-white/10">
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Agent ID
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={agentId}
                            onChange={(e) => {
                                setAgentId(e.target.value);
                                setAgentName(null);
                                setMessage(null);
                            }}
                            placeholder="e.g., 1001"
                            className="flex-1 px-4 py-3.5 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={loading || !agentId}
                            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            Verify
                        </button>
                    </div>
                </div>

                {agentName && (
                    <div className="mb-8 p-6 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-800/70 dark:text-emerald-300/70 uppercase tracking-wider mb-1">Agent Name</p>
                            <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 tracking-tight">{agentName}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
                            👤
                        </div>
                    </div>
                )}

                {agentName && (
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <span>🔄</span>
                        <span>Reset Password to Default</span>
                    </button>
                )}

                {/* Messages */}
                {message && (
                    <div
                        className={`mt-6 p-4 rounded-2xl border ${message.type === "success"
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
            </div>
        </div>
    );
}
