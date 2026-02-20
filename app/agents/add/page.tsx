"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

interface Device {
  device_id: string;
}

export default function AddAgentPage() {
  const router = useRouter();

  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAvailableDevices() {
      // Get active agents
      const { data: activeAgents } = await supabase
        .from("agents")
        .select("assigned_device_id")
        .eq("active_status", true);

      const assignedDeviceIds =
        activeAgents?.map((a) => a.assigned_device_id) || [];

      // Get devices not assigned
      let query = supabase.from("devices").select("device_id");

      if (assignedDeviceIds.length > 0) {
        query = query.not(
          "device_id",
          "in",
          `(${assignedDeviceIds.join(",")})`
        );
      }

      const { data: availableDevices } = await query;

      setDevices(availableDevices || []);
    }

    fetchAvailableDevices();
  }, []);


  const handleAdd = async () => {
    setLoading(true);

    const { error } = await supabase.from("agents").insert({
      agent_id: agentId,
      agent_name: agentName,
      joining_date: joiningDate,
      assigned_device_id: deviceId,
      active_status: true,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/agents");
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight">
            Add New Agent
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Register a new agent in the system
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Agent ID
              </label>
              <input
                type="text"
                placeholder="Enter agent ID"
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="Enter agent name"
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Joining Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Assign Device
              </label>
              <select
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              >
                <option value="" className="dark:bg-slate-900">Select a device</option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id} className="dark:bg-slate-900">
                    {device.device_id}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full px-6 py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  Saving...
                </span>
              ) : (
                "Save Agent"
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
