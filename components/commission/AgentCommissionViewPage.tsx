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
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    My Commission Details
                </h1>
                <p className="text-gray-600">
                    View your commission breakdown by month
                </p>
            </div>

            {/* Selection Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        >
                            <option value="">Select Month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Year
                        </label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            min="2020"
                            max="2100"
                            placeholder="e.g. 2024"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    <button
                        onClick={fetchCommission}
                        disabled={loading || !selectedMonth || !selectedYear}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Commission Details */}
            {commission && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className={`rounded-2xl p-6 shadow-lg border-2 ${commission.approved
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
                        }`}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Commission for {getMonthName(commission.month)} {commission.year}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <p className={`text-lg font-semibold ${commission.approved ? 'text-green-600' : 'text-orange-600'}`}>
                                    {commission.approved ? '✓ Approved' : '⏳ Pending Approval'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Agent</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {commission.bca_name} ({commission.agent_id})
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Location</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {commission.district}, {commission.state_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Device ID</p>
                                <p className="text-lg font-semibold text-gray-900">{commission.device_id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Commission Breakdown */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">Commission Breakdown</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Activity</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Count</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Commission (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Account Opening Section */}
                                    <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Account Opening</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Non-Funded Accounts</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.non_funded_account_open_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.non_funded_account_open_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Funded Accounts</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.funded_account_open_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.funded_account_open_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 bg-blue-50">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total Accounts</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{commission.total_account_open_count}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{commission.total_account_open_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Financial Transactions */}
                                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Financial Transactions</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Transactions</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.financial_txn_count} (₹{commission.financial_txn_amount.toFixed(2)})</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.financial_txn_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Remittance */}
                                    <tr className="bg-gradient-to-r from-purple-50 to-pink-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Remittance</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Remittance</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.remittance_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.remittance_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Attendance & Fixed */}
                                    <tr className="bg-gradient-to-r from-orange-50 to-yellow-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Attendance & Fixed Commission</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Login Days</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.login_days}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">-</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Fixed Commission</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">-</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.fixed_commission.toFixed(2)}</td>
                                    </tr>

                                    {/* Government Schemes */}
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Government Schemes</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">APY (Atal Pension Yojana)</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.apy_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.apy_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">PMSBY (Suraksha Bima Yojana)</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.pmsby_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.pmsby_comm.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">PMJBY (Jeevan Jyoti Bima Yojana)</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.pmjby_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.pmjby_comm.toFixed(2)}</td>
                                    </tr>

                                    {/* Additional Services */}
                                    <tr className="bg-gradient-to-r from-teal-50 to-cyan-50">
                                        <td colSpan={3} className="px-6 py-3 font-bold text-gray-900">Additional Services</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">SSS Incentive (10%)</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">-</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.sss_incentive.toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">Re-KYC</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.rekyc_count}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{commission.rekyc_comm.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Final Summary */}
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Final Commission Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-lg font-bold text-gray-700">NET COMMISSION:</span>
                                <span className="text-lg font-bold text-gray-900">₹{commission.net_commission.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pl-4">
                                <span className="text-sm text-gray-600">BC Commission ({(commission.bc_comm / commission.net_commission * 100).toFixed(1)}%):</span>
                                <span className="text-sm font-medium text-gray-700">₹{commission.bc_comm.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pl-4 pb-3 border-b-2 border-gray-300">
                                <span className="text-sm text-gray-600">Corp Commission ({(commission.corp_comm / commission.net_commission * 100).toFixed(1)}%):</span>
                                <span className="text-sm font-medium text-gray-700">₹{commission.corp_comm.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-base text-red-600 font-medium">Less: TDS ({commission.tds_percent}%):</span>
                                <span className="text-base font-semibold text-red-600">- ₹{commission.tds_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-4 border-green-500">
                                <span className="text-2xl font-bold text-green-700">AGENT NET PAYABLE:</span>
                                <span className="text-2xl font-bold text-green-700">₹{commission.agent_net_payable.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
