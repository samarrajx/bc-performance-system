import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

/**
 * Log the export event to `upload_logs` table
 */
export async function logExport(
    fileType: string,
    fileName: string,
    rowsCount: number,
    status: "SUCCESS" | "FAILED",
    errorMessage?: string
) {
    try {
        const { error } = await supabase.from("upload_logs").insert({
            file_type: fileType,
            file_name: fileName,
            upload_mode: "EXPORT",
            rows_count: rowsCount,
            status: status,
            // error_message: errorMessage, // Uncomment if column exists, implied from sql
        });

        if (error) {
            console.error("Failed to log export:", error);
        }
    } catch (err) {
        console.error("Error logging export:", err);
    }
}

/**
 * Trigger browser download of CSV content
 */
function downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * Export Agents to CSV with joined Device details
 */
export async function exportAgents() {
    try {
        // 1. Fetch all agents
        const { data: agents, error: agentsError } = await supabase
            .from("agents")
            .select("*")
            .order("created_at", { ascending: false });

        if (agentsError) throw agentsError;
        if (!agents || agents.length === 0) throw new Error("No agents found");

        // 2. Fetch all devices
        const { data: devices, error: devicesError } = await supabase
            .from("devices")
            .select("*");

        if (devicesError) throw devicesError;

        // 3. Create a map of devices for quick lookup
        const deviceMap = new Map();
        if (devices) {
            devices.forEach((device) => {
                deviceMap.set(device.device_id, device); // Assuming device_id is the key
            });
        }

        // 4. Merge data
        const mergedData = agents.map((agent) => {
            const device = deviceMap.get(agent.assigned_device_id);
            return {
                ...agent,
                device_branch: device?.branch_name || "N/A",
                device_branch_code: device?.branch_code || "N/A",
                device_district: device?.district || "N/A",
                device_state: device?.state || "N/A",
                device_region_zone: device?.region || "N/A",
                device_bank: device?.bank_name || "N/A",
                device_created_at: device?.created_at || "N/A",
                // Add any other specific fields from devices you want
            };
        });

        // 5. Convert to CSV using PapaParse
        const csv = Papa.unparse(mergedData);

        // 6. Download
        const fileName = `agents_with_devices_${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(csv, fileName);

        // 7. Log
        await logExport("EXPORT_AGENTS", fileName, mergedData.length, "SUCCESS");

        return { success: true, count: mergedData.length };
    } catch (error: any) {
        console.error("Export agents failed:", error);
        await logExport("EXPORT_AGENTS", "agents_export.csv", 0, "FAILED", error.message);
        throw error;
    }
}

/**
 * Export Devices to CSV
 */
export async function exportDevices() {
    try {
        const { count, error: countError } = await supabase
            .from("devices")
            .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        const { data, error } = await supabase.from("devices").select("*").csv();

        if (error) throw error;

        const fileName = `devices_export_${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(data as string, fileName);

        await logExport("EXPORT_DEVICES", fileName, count || 0, "SUCCESS");

        return { success: true, count };
    } catch (error: any) {
        console.error("Export devices failed:", error);
        await logExport("EXPORT_DEVICES", "devices_export.csv", 0, "FAILED", error.message);
        throw error;
    }
}

/**
 * Export Daily Performance to CSV
 */
export async function exportDailyPerformance(startDate: string, endDate: string) {
    try {
        const { count, error: countError } = await supabase
            .from("daily_performance")
            .select("*", { count: "exact", head: true })
            .gte("date", startDate)
            .lte("date", endDate);

        if (countError) throw countError;

        const { data, error } = await supabase
            .from("daily_performance")
            .select("*")
            .gte("date", startDate)
            .lte("date", endDate)
            .csv();

        if (error) throw error;

        const fileName = `daily_performance_${startDate}_to_${endDate}.csv`;
        downloadCSV(data as string, fileName);

        await logExport("EXPORT_DAILY_PERFORMANCE", fileName, count || 0, "SUCCESS");

        return { success: true, count };
    } catch (error: any) {
        console.error("Export daily performance failed:", error);
        await logExport("EXPORT_DAILY_PERFORMANCE", "daily_perf.csv", 0, "FAILED", error.message);
        throw error;
    }
}

/**
 * Export Commissions to CSV
 */
export async function exportCommissions(month: number, year: number) {
    try {
        const { count, error: countError } = await supabase
            .from("commissions")
            .select("*", { count: "exact", head: true })
            .eq("month", month)
            .eq("year", year);

        if (countError) throw countError;

        const { data, error } = await supabase
            .from("commissions")
            .select("*")
            .eq("month", month)
            .eq("year", year)
            .csv();

        if (error) throw error;

        const fileName = `commissions_${month}_${year}.csv`;
        downloadCSV(data as string, fileName);

        await logExport("EXPORT_COMMISSIONS", fileName, count || 0, "SUCCESS");

        return { success: true, count };
    } catch (error: any) {
        console.error("Export commissions failed:", error);
        await logExport("EXPORT_COMMISSIONS", "commissions.csv", 0, "FAILED", error.message);
        throw error;
    }
}
