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
      <h1 className="text-2xl font-bold mb-6">
        Replace Agent ({oldAgentId})
      </h1>

      <div className="bg-white p-6 rounded shadow w-96 space-y-4">
        <input
          type="text"
          placeholder="New Agent ID"
          className="w-full border p-2 rounded"
          value={newAgentId}
          onChange={(e) => setNewAgentId(e.target.value)}
        />

        <input
          type="text"
          placeholder="New Agent Name"
          className="w-full border p-2 rounded"
          value={newAgentName}
          onChange={(e) => setNewAgentName(e.target.value)}
        />

        <input
          type="date"
          className="w-full border p-2 rounded"
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
        />

        <p className="text-sm text-gray-600">
          Device: {deviceId}
        </p>

        <button
          onClick={handleReplace}
          className="w-full bg-black text-white p-2 rounded"
        >
          Replace Agent
        </button>
      </div>
    </AdminLayout>
  );
}
