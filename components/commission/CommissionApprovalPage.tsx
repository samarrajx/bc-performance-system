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
    net_commission_raw: number;
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
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    Commission Approval
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Review and approve commission data for agents
                </p>
            </div>

            {/* Selection Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={loading}
                        >
                            <option value="">Choose a month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Year
                        </label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            min="2020"
                            max="2100"
                            placeholder="e.g., 2024"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={loading}
                        />
                    </div>

                    <button
                        onClick={fetchCommissions}
                        disabled={loading || !selectedMonth || !selectedYear}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Loading...' : 'Load Commissions'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-lg border mb-6 ${message.type === "success"
                        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl">
                            {message.type === "success" ? "✓" : "⚠"}
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold mb-1">
                                {message.type === "success" ? "Success!" : "Error"}
                            </p>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Commission Table */}
            {commissions.length > 0 && (
                <>
                    {/* Approve All Button */}
                    <div className="mb-6">
                        <button
                            onClick={approveAll}
                            disabled={loading || commissions.every(c => c.approved)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <span>✓</span>
                            <span>Approve All ({commissions.filter(c => !c.approved).length} pending)</span>
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Agent ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">BC Comm</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Corp Comm</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Net Comm</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">TDS ({commissions[0]?.tds_percent}%)</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">TDS Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Net Payable</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {commissions.map((comm) => (
                                        <tr key={comm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{comm.agent_id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{comm.bc_comm.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{comm.corp_comm.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{comm.net_commission_raw.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{comm.tds_percent.toFixed(2)}%</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">₹{comm.tds_amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">
                                                ₹{comm.agent_net_payable.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {comm.approved ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                                                        ✓ Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800">
                                    <tr className="font-semibold">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">TOTAL</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            ₹{commissions.reduce((sum, c) => sum + c.bc_comm, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            ₹{commissions.reduce((sum, c) => sum + c.corp_comm, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            ₹{commissions.reduce((sum, c) => sum + c.net_commission_raw, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">-</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            ₹{commissions.reduce((sum, c) => sum + c.tds_amount, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">
                                            ₹{commissions.reduce((sum, c) => sum + c.agent_net_payable, 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {commissions.filter(c => c.approved).length} / {commissions.length}
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
