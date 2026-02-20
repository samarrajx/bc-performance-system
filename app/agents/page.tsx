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
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight">
              Agents Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage agent profiles, status, and view assignments
            </p>
          </div>

          <button
            onClick={() => router.push("/agents/add")}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 group"
          >
            <span className="text-xl leading-none group-hover:rotate-90 transition-transform duration-300">+</span>
            <span>Add Agent</span>
          </button>
        </div>

        {/* --- FILTERS SECTION --- */}
        <div className="glass-panel p-5 rounded-2xl flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Agent Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
              />
            </div>
          </div>

          {/* Region Filter */}
          <div className="w-48">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
            >
              <option value="All" className="dark:bg-slate-900">All Regions</option>
              {uniqueRegions.map(r => (
                <option key={r} value={r} className="dark:bg-slate-900">{r}</option>
              ))}
              <option value="Unknown" className="dark:bg-slate-900">Unknown (Missing)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
            >
              <option value="All" className="dark:bg-slate-900">All Status</option>
              <option value="Active" className="dark:bg-slate-900">Active</option>
              <option value="Inactive" className="dark:bg-slate-900">Inactive</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="pt-6">
            <button
              onClick={() => { setSearchQuery(""); setSelectedRegion("All"); setStatusFilter("All"); }}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 glass-panel rounded-3xl mt-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading agents...</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Agent ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Device ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Joining Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      <div className="text-4xl mb-4 opacity-50">🔍</div>
                      No agents found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr
                      key={agent.agent_id}
                      className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{agent.agent_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{agent.agent_name}</td>
                      <td className="px-6 py-4 text-sm">
                        {agent.devices?.region ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                            {agent.devices.region}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm"><span className="bg-white/50 dark:bg-black/20 font-mono px-2 py-1 rounded border border-white/20 dark:border-white/10 text-slate-500 dark:text-slate-400">{agent.assigned_device_id || 'Unassigned'}</span></td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{agent.joining_date}</td>

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
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${agent.active_status
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-500/20"
                            }`}
                        >
                          {agent.active_status ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() =>
                            router.push(`/agents/replace/${agent.agent_id}`)
                          }
                          className="text-emerald-600 dark:text-emerald-400 font-bold text-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20"
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
