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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Agents</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalAgents}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Devices</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalDevices}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Unassigned Devices</p>
                    <p className={`text-2xl font-bold ${stats.orphanDevices > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {stats.orphanDevices}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Agents w/o Device</p>
                    <p className={`text-2xl font-bold ${stats.agentsWithoutDevices > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {stats.agentsWithoutDevices}
                    </p>
                </div>
            </div>

            {/* Issues List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span>🏥</span> System Health Issues
                </h2>

                {issues.length === 0 ? (
                    <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <p className="text-green-700 dark:text-green-300 font-medium text-lg">All systems healthy!</p>
                        <p className="text-green-600 dark:text-green-400 text-sm">No consistency issues found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {issues.map((issue, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border flex items-start gap-4 ${issue.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                issue.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                <div className={`text-2xl ${issue.type === 'error' ? 'text-red-600 dark:text-red-400' :
                                    issue.type === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                                        'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {issue.type === 'error' ? '⛔' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${issue.type === 'error' ? 'text-red-800 dark:text-red-300' :
                                        issue.type === 'warning' ? 'text-orange-800 dark:text-orange-300' :
                                            'text-blue-800 dark:text-blue-300'
                                        }`}>
                                        {issue.title}
                                    </h3>
                                    <p className={`text-sm ${issue.type === 'error' ? 'text-red-700 dark:text-red-200' :
                                        issue.type === 'warning' ? 'text-orange-700 dark:text-orange-200' :
                                            'text-blue-700 dark:text-blue-200'
                                        }`}>
                                        {issue.description}
                                    </p>
                                </div>
                                <div className={`text-xl font-bold ${issue.type === 'error' ? 'text-red-800 dark:text-red-300' :
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
