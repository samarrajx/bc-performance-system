"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface UploadLog {
    id: number;
    file_type: string;
    file_name: string;
    upload_mode: string;
    rows_count: number;
    status: "SUCCESS" | "FAILED";
    error_message?: string;
    created_at: string;
}

export default function UploadLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<UploadLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("upload_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterType !== "ALL") {
                query = query.eq("file_type", filterType);
            }

            if (filterStatus !== "ALL") {
                query = query.eq("status", filterStatus);
            }

            if (startDate) {
                query = query.gte("created_at", `${startDate}T00:00:00`);
            }

            if (endDate) {
                query = query.lte("created_at", `${endDate}T23:59:59`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching logs:", error);
            } else {
                setLogs(data || []);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [filterType, filterStatus, startDate, endDate]);

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
            fetchLogs();
        }
        checkAdmin();
    }, [router, fetchLogs]);

    const getStatusColor = (status: string) => {
        return status === "SUCCESS"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    };

    const fileTypes = [
        "ALL",
        "COMMISSION_UPLOAD",
        "DAILY_PERFORMANCE",
        "EXPORT_AGENTS",
        "EXPORT_DEVICES",
        "EXPORT_DAILY_PERFORMANCE",
        "EXPORT_COMMISSIONS",
    ];

    return (
        <AdminLayout>
            <div className="mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                    System Audit Logs
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    Track all system uploads, exports, and data modifications.
                </p>
            </div>

            {/* Filters */}
            <div className="glass-panel p-6 rounded-3xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            File Type
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                        >
                            {fileTypes.map((t) => (
                                <option key={t} value={t} className="dark:bg-slate-900">
                                    {t.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                        >
                            <option value="ALL" className="dark:bg-slate-900">All Status</option>
                            <option value="SUCCESS" className="dark:bg-slate-900">Success</option>
                            <option value="FAILED" className="dark:bg-slate-900">Failed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border-white/20 dark:border-white/10">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    File Type
                                </th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    File Name
                                </th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Mode
                                </th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Rows
                                </th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                                        <div className="flex justify-center items-center gap-3">
                                            <div className="animate-spin h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full"></div>
                                            Loading logs...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                                        No logs found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 text-xs font-bold rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                                {log.file_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {log.file_name}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {log.upload_mode}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {log.rows_count.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 text-xs font-bold rounded-md border inline-block ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}
                                            >
                                                {log.status}
                                            </span>
                                            {log.error_message && (
                                                <div className="text-xs text-red-600 dark:text-red-400 mt-2 max-w-xs truncate font-medium bg-red-500/5 px-2 py-1 rounded" title={log.error_message}>
                                                    {log.error_message}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
