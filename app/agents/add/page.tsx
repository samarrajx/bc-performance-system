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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Add New Agent
          </h1>
          <p className="text-gray-600">
            Register a new agent in the system
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent ID
              </label>
              <input
                type="text"
                placeholder="Enter agent ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="Enter agent name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Joining Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign Device
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_id}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
