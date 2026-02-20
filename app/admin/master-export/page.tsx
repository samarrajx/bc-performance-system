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
            <div className="mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    Master Export Module
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    Export system data to CSV for analysis and reporting.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Agents Export */}
                <div className="glass-panel rounded-3xl p-8 border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                            👥
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Agents</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Export complete agent list</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport("agents", exportAgents)}
                        disabled={!!exporting}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-2"
                    >
                        {exporting === "agents" ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Devices Export */}
                <div className="glass-panel rounded-3xl p-8 border-2 border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-purple-500/10 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                            📱
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Devices</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Export registered devices</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport("devices", exportDevices)}
                        disabled={!!exporting}
                        className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-2"
                    >
                        {exporting === "devices" ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Daily Performance Export */}
                <div className="glass-panel rounded-3xl p-8 border-2 border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                            📊
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                Daily Performance
                            </h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Export performance by date range
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={perfStartDate}
                                onChange={(e) => setPerfStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={perfEndDate}
                                onChange={(e) => setPerfEndDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
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
                        className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-2"
                    >
                        {exporting === "daily" ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></div>
                                Exporting...
                            </>
                        ) : (
                            "Download CSV"
                        )}
                    </button>
                </div>

                {/* Commissions Export */}
                <div className="glass-panel rounded-3xl p-8 border-2 border-pink-500/20 hover:border-pink-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-pink-500/10 dark:bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                            💰
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                                Commissions
                            </h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Export calculated commissions
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Month
                            </label>
                            <select
                                value={commMonth}
                                onChange={(e) => setCommMonth(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-pink-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                            >
                                {months.map((m) => (
                                    <option key={m.value} value={m.value} className="dark:bg-slate-900">
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Year
                            </label>
                            <select
                                value={commYear}
                                onChange={(e) => setCommYear(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-pink-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y} className="dark:bg-slate-900">
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
                        className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-2"
                    >
                        {exporting === "commissions" ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></div>
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
