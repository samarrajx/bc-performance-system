"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

interface Agent {
  agent_id: string;
  agent_name: string;
  assigned_device_id: string;
  joining_date: string;
  active_status: boolean;
  devices: {
    region: string;
  } | null;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function checkAdminAndFetch() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      // Fetch agents with Region from devices table
      const { data, error } = await supabase
        .from("agents")
        .select("*, devices(region)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching agents:", error);
      }

      // Supabase returns it as 'devices: { region: ... }' (object) or array depending on relation type
      // Since assigned_device_id is FK to devices.device_id (1-to-1 or Many-to-1), it returns an object or null.
      // We cast it to match our interface.
      const typedData = (data as any[])?.map(item => ({
        ...item,
        devices: Array.isArray(item.devices) ? item.devices[0] : item.devices
      })) as Agent[];

      setAgents(typedData || []);
      setFilteredAgents(typedData || []);
      setLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  // Handle Filtering
  useEffect(() => {
    let result = agents;

    // 1. Search (ID or Name)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.agent_id.toLowerCase().includes(lowerQuery) ||
          a.agent_name.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Region Filter
    if (selectedRegion !== "All") {
      result = result.filter((a) => a.devices?.region === selectedRegion);
    }

    // 3. Status Filter
    if (statusFilter !== "All") {
      const isActive = statusFilter === "Active";
      result = result.filter((a) => a.active_status === isActive);
    }

    setFilteredAgents(result);
  }, [searchQuery, selectedRegion, statusFilter, agents]);

  // Get Unique Regions for Dropdown
  const uniqueRegions = Array.from(new Set(agents.map(a => a.devices?.region).filter(Boolean))).sort();

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 dark:from-green-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
              Agents Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage agent profiles, status, and view assignments
            </p>
          </div>

          <button
            onClick={() => router.push("/agents/add")}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Agent</span>
          </button>
        </div>

        {/* --- FILTERS SECTION --- */}
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-wrap gap-4 items-center transition-colors">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Agent Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Region Filter */}
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
            >
              <option value="All" className="dark:bg-neutral-800">All Regions</option>
              {uniqueRegions.map(r => (
                <option key={r} value={r} className="dark:bg-neutral-800">{r}</option>
              ))}
              <option value="Unknown" className="dark:bg-neutral-800">Unknown (Missing)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
            >
              <option value="All" className="dark:bg-neutral-800">All Status</option>
              <option value="Active" className="dark:bg-neutral-800">Active</option>
              <option value="Inactive" className="dark:bg-neutral-800">Inactive</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="pt-5">
            <button
              onClick={() => { setSearchQuery(""); setSelectedRegion("All"); setStatusFilter("All"); }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading agents...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Agent ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Device ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Joining Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No agents found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr
                      key={agent.agent_id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">{agent.agent_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{agent.agent_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {agent.devices?.region ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {agent.devices.region}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{agent.assigned_device_id || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.joining_date}</td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from("agents")
                              .update({ active_status: !agent.active_status })
                              .eq("agent_id", agent.agent_id);

                            if (!error) {
                              setAgents((prev) =>
                                prev.map((a) =>
                                  a.agent_id === agent.agent_id
                                    ? {
                                      ...a,
                                      active_status: !a.active_status,
                                    }
                                    : a
                                )
                              );
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${agent.active_status
                            ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-800/50"
                            : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10"
                            }`}
                        >
                          {agent.active_status ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() =>
                            router.push(`/agents/replace/${agent.agent_id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm hover:underline"
                        >
                          Replace Device
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
