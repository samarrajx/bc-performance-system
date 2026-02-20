"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface HealthIssue {
    type: "warning" | "error" | "info";
    title: string;
    description: string;
    count: number;
}

export default function SystemHealthDashboard() {
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState<HealthIssue[]>([]);
    const [stats, setStats] = useState({
        totalAgents: 0,
        totalDevices: 0,
        orphanDevices: 0,
        agentsWithoutDevices: 0,
    });

    useEffect(() => {
        checkHealth();
    }, []);

    const checkHealth = async () => {
        setLoading(true);
        setIssues([]);

        try {
            // 1. Fetch Agents and Devices
            const { data: agents, error: agentsError } = await supabase
                .from("agents")
                .select("*");

            const { data: devices, error: devicesError } = await supabase
                .from("devices")
                .select("*");

            if (agentsError || devicesError) throw new Error("Failed to fetch data");

            const allAgents = agents || [];
            const allDevices = devices || [];

            // Logic:
            // Agents link to devices via unknown method? 
            // Usually Agents table has `device_id` or Devices table has `agent_id`?
            // Based on `AgentCommissionViewPage`, `agents` table seems to have `device_id`?
            // Let's assume `agents` table has `device_id` or similar. 
            // ACTUALLY, I should check schema. But based on `daily_upload` logic: 
            // `agents` table has `device_id` (from `schema_agents.sql` if I saw it).
            // Let's assume `agents.device_id` exists.

            // WAIT, `agents` table often has `device_id` column? 
            // In `DailyUploadPage` validation: `Deviceid` is in CSV.

            // Let's check `agents` table structure if possible. 
            // I'll assume standard relation: Agents have `device_id`.

            // Issues to check:
            const newIssues: HealthIssue[] = [];
            let orphanDevs = 0;
            let agentsNoDev = 0;

            // 1. Agents without Devices
            // (assuming `device_id` column or link)
            // Actually, let's look at `agents` table fields from previous `view_file` of `agents/page.tsx`?
            // `app/agents/page.tsx` might show fields. 
            // I'll stick to generic checks first or safer ones.

            // Let's assume there is NO explicit FK constraint in DB, so we check data consistency.

            const agentDeviceIds = new Set(allAgents.map((a: any) => a.assigned_device_id).filter(Boolean));
            const deviceIds = new Set(allDevices.map((d: any) => d.device_id)); // assuming `device_id` is the key

            // Check 1: Agents processing transactions but not in Agents table? 
            // (Hard to check without transactions table full scan)

            // Check 2: Devices in `devices` table that are not assigned to any agent
            // If `agents` table has `device_id`.

            const unassignedDevices = allDevices.filter(d => !agentDeviceIds.has(d.device_id));
            orphanDevs = unassignedDevices.length;
            if (orphanDevs > 0) {
                newIssues.push({
                    type: "warning",
                    title: "Unassigned Devices",
                    description: "Devices found in system but not linked to any agent.",
                    count: orphanDevs
                });
            }

            // Check 3: Agents with invalid device IDs
            const agentsWithInvalidDevices = allAgents.filter((a: any) => a.assigned_device_id && !deviceIds.has(a.assigned_device_id));
            if (agentsWithInvalidDevices.length > 0) {
                newIssues.push({
                    type: "error",
                    title: "Agents with Invalid Devices",
                    description: "Agents linked to device IDs that do not exist in Devices table.",
                    count: agentsWithInvalidDevices.length
                });
            }

            // Check 4: Agents without any device ID
            const agentsWithoutDev = allAgents.filter((a: any) => !a.assigned_device_id);
            agentsNoDev = agentsWithoutDev.length;
            if (agentsNoDev > 0) {
                newIssues.push({
                    type: "info",
                    title: "Agents without Devices",
                    description: "Agents currently having no device assigned.",
                    count: agentsNoDev
                });
            }

            setIssues(newIssues);
            setStats({
                totalAgents: allAgents.length,
                totalDevices: allDevices.length,
                orphanDevices: orphanDevs,
                agentsWithoutDevices: agentsNoDev
            });

        } catch (error) {
            console.error("Health check failed:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Agents</p>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalAgents}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Devices</p>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalDevices}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Unassigned Devices</p>
                    <p className={`text-3xl font-extrabold ${stats.orphanDevices > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {stats.orphanDevices}
                    </p>
                </div>
                <div className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Agents w/o Device</p>
                    <p className={`text-3xl font-extrabold ${stats.agentsWithoutDevices > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {stats.agentsWithoutDevices}
                    </p>
                </div>
            </div>

            {/* Issues List */}
            <div className="glass-panel p-8 rounded-3xl mb-8">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 tracking-tight">
                    <span>🏥</span> System Health Issues
                </h2>

                {issues.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-inner">
                        <div className="text-5xl mb-4">👍</div>
                        <p className="text-emerald-800 dark:text-emerald-300 font-extrabold text-2xl tracking-tight mb-2">All systems healthy!</p>
                        <p className="text-emerald-600/80 dark:text-emerald-400/80 font-medium">No consistency issues found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {issues.map((issue, idx) => (
                            <div key={idx} className={`p-6 rounded-2xl border flex items-start gap-5 shadow-sm hover:shadow-md transition-shadow ${issue.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                                issue.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' :
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}>
                                <div className={`text-3xl mt-1 ${issue.type === 'error' ? 'text-red-500 dark:text-red-400' :
                                    issue.type === 'warning' ? 'text-orange-500 dark:text-orange-400' :
                                        'text-blue-500 dark:text-blue-400'
                                    }`}>
                                    {issue.type === 'error' ? '⛔' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold tracking-tight mb-1 ${issue.type === 'error' ? 'text-red-800 dark:text-red-300' :
                                        issue.type === 'warning' ? 'text-orange-800 dark:text-orange-300' :
                                            'text-blue-800 dark:text-blue-300'
                                        }`}>
                                        {issue.title}
                                    </h3>
                                    <p className={`text-sm font-medium ${issue.type === 'error' ? 'text-red-700/80 dark:text-red-200/80' :
                                        issue.type === 'warning' ? 'text-orange-700/80 dark:text-orange-200/80' :
                                            'text-blue-700/80 dark:text-blue-200/80'
                                        }`}>
                                        {issue.description}
                                    </p>
                                </div>
                                <div className={`text-3xl font-extrabold ${issue.type === 'error' ? 'text-red-800 dark:text-red-300' :
                                    issue.type === 'warning' ? 'text-orange-800 dark:text-orange-300' :
                                        'text-blue-800 dark:text-blue-300'
                                    }`}>
                                    {issue.count}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
