"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Commission {
    id: number;
    agent_id: string;
    month: number;
    year: number;

    // Agent Details
    bca_name: string;
    state_name: string;
    zone_name: string;
    district: string;
    sol_id: string;
    device_id: string;

    // Account Opening
    non_funded_account_open_count: number;
    non_funded_account_open_comm: number;
    funded_account_open_count: number;
    funded_account_open_comm: number;
    total_account_open_count: number;
    total_account_open_comm: number;

    // Financial Transactions
    financial_txn_count: number;
    financial_txn_amount: number;
    financial_txn_comm: number;

    // Remittance
    remittance_count: number;
    remittance_comm: number;

    // Login
    login_days: number;
    fixed_commission: number;

    // Government Schemes
    apy_count: number;
    apy_comm: number;
    pmsby_count: number;
    pmsby_comm: number;
    pmjby_count: number;
    pmjby_comm: number;

    // Incentives & Re-KYC
    sss_incentive: number;
    rekyc_count: number;
    rekyc_comm: number;

    // Final Totals
    net_commission: number;
    bc_comm: number;
    corp_comm: number;
    tds_percent: number;
    tds_amount: number;
    agent_net_payable: number;

    approved: boolean;
    approved_at: string | null;
}

export default function AgentCommissionViewPage() {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [commission, setCommission] = useState<Commission | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCommission = async () => {
        if (!selectedMonth || !selectedYear) return;

        setLoading(true);
        setError(null);
        setCommission(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("commissions")
                .select("*")
                .eq("month", parseInt(selectedMonth))
                .eq("year", parseInt(selectedYear))
                .single();

            if (fetchError) {
                throw new Error("No commission data found for this period");
            }

            setCommission(data);
        } catch (err: any) {
            setError(err.message);
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
        <div className="max-w-7xl">
            <div className="mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    My Commission Details
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    View your commission breakdown by month
                </p>
            </div>

            {/* Selection Controls */}
            <div className="glass-panel p-6 rounded-3xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                        >
                            <option value="" className="dark:bg-slate-900">Select Month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m} className="dark:bg-slate-900">{getMonthName(m)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Year
                        </label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            min="2020"
                            max="2100"
                            placeholder="e.g. 2024"
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                        />
                    </div>

                    <button
                        onClick={fetchCommission}
                        disabled={loading || !selectedMonth || !selectedYear}
                        className="w-full px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                Loading...
                            </span>
                        ) : (
                            'View Commission'
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl mb-6">
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Commission Details */}
            {commission && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className={`glass-panel rounded-3xl p-8 border-2 ${commission.approved
                        ? 'border-emerald-500/30 dark:border-emerald-500/20'
                        : 'border-amber-500/30 dark:border-amber-500/20'
                        }`}>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                            Commission for {getMonthName(commission.month)} {commission.year}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-4 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <p className={`text-lg font-bold ${commission.approved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {commission.approved ? '✅ Approved' : '⏳ Pending Approval'}
                                </p>
                            </div>
                            <div className="p-4 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Agent</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {commission.bca_name} <span className="text-sm text-slate-500 dark:text-slate-400">({commission.agent_id})</span>
                                </p>
                            </div>
                            <div className="p-4 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {commission.district}, {commission.state_name}
                                </p>
                            </div>
                            <div className="p-4 bg-white/40 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Device ID</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{commission.device_id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Commission Breakdown */}
                    <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border-white/20 dark:border-white/10">
                        <div className="px-8 py-5 bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Commission Breakdown</h3>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-500/5 dark:bg-slate-500/10">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Count</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commission (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 dark:divide-white/5">
                                    {/* Account Opening Section */}
                                    <tr className="bg-blue-500/10 dark:bg-blue-500/5 border-t border-blue-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Account Opening</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Non-Funded Accounts</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.non_funded_account_open_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.non_funded_account_open_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Funded Accounts</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.funded_account_open_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.funded_account_open_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-blue-500/5 dark:bg-blue-500/10 border-t border-blue-500/10">
                                        <td className="px-8 py-4 text-sm font-extrabold text-blue-800 dark:text-blue-300">Total Accounts</td>
                                        <td className="px-8 py-4 text-sm font-extrabold text-blue-800 dark:text-blue-300">{commission.total_account_open_count}</td>
                                        <td className="px-8 py-4 text-sm font-extrabold text-blue-800 dark:text-blue-300">₹{commission.total_account_open_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Financial Transactions */}
                                    <tr className="bg-emerald-500/10 dark:bg-emerald-500/5 border-t border-emerald-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Financial Transactions</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Transactions</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.financial_txn_count} <span className="text-slate-500 font-normal">(₹{commission.financial_txn_amount.toFixed(2)})</span></td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.financial_txn_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Remittance */}
                                    <tr className="bg-purple-500/10 dark:bg-purple-500/5 border-t border-purple-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Remittance</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Remittance</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.remittance_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.remittance_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Attendance & Fixed */}
                                    <tr className="bg-amber-500/10 dark:bg-amber-500/5 border-t border-amber-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Attendance & Fixed Commission</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Login Days</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.login_days}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">-</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Fixed Commission</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">-</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.fixed_commission.toFixed(2)}</td>
                                    </tr>

                                    {/* Government Schemes */}
                                    <tr className="bg-indigo-500/10 dark:bg-indigo-500/5 border-t border-indigo-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Government Schemes</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">APY (Atal Pension Yojana)</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.apy_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.apy_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">PMSBY (Suraksha Bima Yojana)</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.pmsby_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.pmsby_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">PMJBY (Jeevan Jyoti Bima Yojana)</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.pmjby_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.pmjby_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Additional Services */}
                                    <tr className="bg-cyan-500/10 dark:bg-cyan-500/5 border-t border-cyan-500/20">
                                        <td colSpan={3} className="px-8 py-3 text-sm font-extrabold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">Additional Services</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">SSS Incentive (10%)</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">-</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.sss_incentive.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">Re-KYC</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{commission.rekyc_count}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">₹{commission.rekyc_comm.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Final Summary */}
                    <div className="glass-panel mt-6 rounded-3xl p-8 border-2 border-emerald-500/30 dark:border-emerald-500/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Final Commission Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3">
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">NET COMMISSION:</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">₹{commission.net_commission.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/30 dark:bg-black/30 rounded-2xl border border-white/20 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">BC Comm ({(commission.bc_comm / commission.net_commission * 100).toFixed(1)}%)</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">₹{commission.bc_comm.toFixed(2)}</span>
                                </div>
                                <div className="p-4 bg-white/30 dark:bg-black/30 rounded-2xl border border-white/20 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Corp Comm ({(commission.corp_comm / commission.net_commission * 100).toFixed(1)}%)</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">₹{commission.corp_comm.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-t border-white/20 dark:border-white/10">
                                <span className="text-base text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Less: TDS ({commission.tds_percent}%)</span>
                                <span className="text-base font-bold text-red-600 dark:text-red-400">- ₹{commission.tds_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">AGENT NET PAYABLE</span>
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{commission.agent_net_payable.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
