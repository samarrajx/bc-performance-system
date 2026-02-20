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
      <div className="max-w-md w-full mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Replace Agent
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Assigning a new agent to replace <span className="font-bold text-slate-700 dark:text-slate-300">{oldAgentId}</span>
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-md space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Agent ID</label>
          <input
            type="text"
            placeholder="New Agent ID"
            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Agent Name</label>
          <input
            type="text"
            placeholder="New Agent Name"
            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Joining Date</label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
          />
        </div>

        <div className="bg-slate-50/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Device</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-black/40 px-3 py-1 rounded border border-white/20 dark:border-white/10">{deviceId || "Loading..."}</span>
        </div>

        <button
          onClick={handleReplace}
          className="w-full px-6 py-4 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
        >
          Replace Agent
        </button>
      </div>
    </AdminLayout>
  );
}
