"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

export default function ReplaceAgentPage() {
  const router = useRouter();
  const params = useParams();
  const oldAgentId = params.id as string;

  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  useEffect(() => {
    async function fetchOldAgent() {
      const { data } = await supabase
        .from("agents")
        .select("assigned_device_id")
        .eq("agent_id", oldAgentId)
        .single();

      if (data) {
        setDeviceId(data.assigned_device_id);
      }
    }

    fetchOldAgent();
  }, [oldAgentId]);

  const handleReplace = async () => {
    // Step 1: deactivate old
    await supabase
      .from("agents")
      .update({ active_status: false })
      .eq("agent_id", oldAgentId);

    // Step 2: create new
    await supabase.from("agents").insert({
      agent_id: newAgentId,
      agent_name: newAgentName,
      joining_date: joiningDate,
      assigned_device_id: deviceId,
      active_status: true,
    });

    router.push("/agents");
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent dark:from-green-400 dark:to-teal-400">
        Replace Agent ({oldAgentId})
      </h1>

      <div className="bg-white dark:bg-white/5 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6 border border-gray-100 dark:border-white/10 transition-colors">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Agent ID</label>
          <input
            type="text"
            placeholder="New Agent ID"
            className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Agent Name</label>
          <input
            type="text"
            placeholder="New Agent Name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400"
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Joining Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
          />
        </div>

        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-100 dark:border-white/5">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-200">Current Device:</span> {deviceId}
          </p>
        </div>

        <button
          onClick={handleReplace}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl"
        >
          Replace Agent
        </button>
      </div>
    </AdminLayout>
  );
}
