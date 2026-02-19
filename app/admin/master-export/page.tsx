"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
    exportAgents,
    exportDevices,
    exportDailyPerformance,
    exportCommissions,
} from "@/lib/export_helpers";

export default function MasterExportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    // Filter States
    const [perfStartDate, setPerfStartDate] = useState("");
    const [perfEndDate, setPerfEndDate] = useState("");
    const [commMonth, setCommMonth] = useState<number>(new Date().getMonth() + 1);
    const [commYear, setCommYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin") {
                router.push("/unauthorized");
                return;
            }
            setLoading(false);
        }
        checkAdmin();
    }, [router]);

    const handleExport = async (
        type: string,
        action: () => Promise<any>
    ) => {
        setExporting(type);
        try {
            await action();
            // Optional: Show success toast
        } catch (error) {
            console.error(`Error exporting ${type}:`, error);
            alert(`Failed to export ${type}. Check console for details.`);
        } finally {
            setExporting(null);
        }
    };

    const years = [2024, 2025, 2026, 2027];
    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Master Export Module
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Export system data to CSV for analysis and reporting.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Agents Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 text-2xl">
                            👥
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Agents</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Export complete agent list</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport("agents", exportAgents)}
                        disabled={!!exporting}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex justify-center items-center gap-2"
                    >
                        {exporting === "agents" ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Devices Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 text-2xl">
                            📱
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Devices</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Export registered devices</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport("devices", exportDevices)}
                        disabled={!!exporting}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex justify-center items-center gap-2"
                    >
                        {exporting === "devices" ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Daily Performance Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 text-2xl">
                            📊
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                Daily Performance
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Export performance by date range
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={perfStartDate}
                                onChange={(e) => setPerfStartDate(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={perfEndDate}
                                onChange={(e) => setPerfEndDate(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            handleExport("daily", () =>
                                exportDailyPerformance(perfStartDate, perfEndDate)
                            )
                        }
                        disabled={!!exporting || !perfStartDate || !perfEndDate}
                        className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex justify-center items-center gap-2"
                    >
                        {exporting === "daily" ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Commissions Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 text-2xl">
                            💰
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                Commissions
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Export calculated commissions
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Month
                            </label>
                            <select
                                value={commMonth}
                                onChange={(e) => setCommMonth(parseInt(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Year
                            </label>
                            <select
                                value={commYear}
                                onChange={(e) => setCommYear(parseInt(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            handleExport("commissions", () =>
                                exportCommissions(commMonth, commYear)
                            )
                        }
                        disabled={!!exporting}
                        className="w-full py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex justify-center items-center gap-2"
                    >
                        {exporting === "commissions" ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
