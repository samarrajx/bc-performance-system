"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/layout/AdminLayout";

interface Commission {
    id: number;
    agent_id: string;
    month: number;
    year: number;
    bc_comm: number;
    corp_comm: number;
    net_commission: number;
    tds_percent: number;
    tds_amount: number;
    agent_net_payable: number;
    approved: boolean;
    approved_at: string | null;
}

export default function CommissionApprovalPage() {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);



    const fetchCommissions = async () => {
        if (!selectedMonth || !selectedYear) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase
                .from("commissions")
                .select("*")
                .eq("month", parseInt(selectedMonth))
                .eq("year", parseInt(selectedYear))
                .order("agent_id");

            if (error) throw error;

            setCommissions(data || []);

            if (!data || data.length === 0) {
                setMessage({
                    type: "error",
                    text: `No commission data found for ${getMonthName(parseInt(selectedMonth))} ${selectedYear}`
                });
            }
        } catch (error: any) {
            console.error("Fetch error:", error);
            setMessage({ type: "error", text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const approveAll = async () => {
        if (!selectedMonth || !selectedYear) return;

        const confirmed = window.confirm(
            `Approve ALL commissions for ${getMonthName(parseInt(selectedMonth))} ${selectedYear}?\n\n` +
            `This will make them visible to agents and cannot be undone.`
        );

        if (!confirmed) return;

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from("commissions")
                .update({
                    approved: true,
                    approved_at: new Date().toISOString(),
                    approved_by: 'admin' // You can get actual user ID from auth
                })
                .eq("month", parseInt(selectedMonth))
                .eq("year", parseInt(selectedYear));

            if (error) throw error;

            setMessage({
                type: "success",
                text: `Successfully approved all commissions for ${getMonthName(parseInt(selectedMonth))} ${selectedYear}`
            });

            // Refresh data
            fetchCommissions();
        } catch (error: any) {
            console.error("Approval error:", error);
            setMessage({ type: "error", text: `Error: ${error.message}` });
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
            <div className="mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    Commission Approval
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Review and approve commission data for agents
                </p>
            </div>

            {/* Selection Controls */}
            <div className="glass-panel p-6 rounded-3xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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

                    <button
                        onClick={fetchCommissions}
                        disabled={loading || !selectedMonth || !selectedYear}
                        className="w-full px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {loading ? 'Loading...' : 'Load Commissions'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-2xl border mb-6 ${message.type === "success"
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
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Commission Table */}
            {commissions.length > 0 && (
                <>
                    {/* Approve All Button */}
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={approveAll}
                            disabled={loading || commissions.every(c => c.approved)}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                        >
                            <span>✅</span>
                            <span>Approve All ({commissions.filter(c => !c.approved).length} pending)</span>
                        </button>
                    </div>

                    {/* Table */}
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border-white/20 dark:border-white/10">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Agent ID</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">BC Comm</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Corp Comm</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Net Comm</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">TDS ({commissions[0]?.tds_percent}%)</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">TDS Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Net Payable</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 dark:divide-white/5">
                                    {commissions.map((comm) => (
                                        <tr key={comm.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{comm.agent_id}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">₹{comm.bc_comm.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">₹{comm.corp_comm.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">₹{(comm.net_commission || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{comm.tds_percent.toFixed(2)}%</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">₹{comm.tds_amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                                ₹{comm.agent_net_payable.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                {comm.approved ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                        ✓ Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-white/50 dark:bg-black/50 backdrop-blur-md border-t border-white/20 dark:border-white/10">
                                    <tr className="font-bold text-slate-800 dark:text-slate-200">
                                        <td className="px-6 py-4 text-sm">TOTAL</td>
                                        <td className="px-6 py-4 text-sm">
                                            ₹{commissions.reduce((sum, c) => sum + c.bc_comm, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            ₹{commissions.reduce((sum, c) => sum + c.corp_comm, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            ₹{commissions.reduce((sum, c) => sum + (c.net_commission || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">-</td>
                                        <td className="px-6 py-4 text-sm">
                                            ₹{commissions.reduce((sum, c) => sum + c.tds_amount, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400">
                                            ₹{commissions.reduce((sum, c) => sum + c.agent_net_payable, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <span className="bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20">{commissions.filter(c => c.approved).length} / {commissions.length}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
