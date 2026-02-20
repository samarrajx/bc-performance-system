"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

interface Device {
  device_id: string;
  branch_name: string;
  district: string;
  state: string;
  region: string;
  created_at: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");

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

      const { data } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });

      setDevices(data || []);
      setFilteredDevices(data || []);
      setLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  // Handle Filtering
  useEffect(() => {
    let result = devices;

    // 1. Search (ID, Branch, District)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          (d.device_id?.toLowerCase() || "").includes(lowerQuery) ||
          (d.branch_name?.toLowerCase() || "").includes(lowerQuery) ||
          (d.district?.toLowerCase() || "").includes(lowerQuery)
      );
    }

    // 2. State Filter
    if (selectedState !== "All") {
      result = result.filter((d) => d.state === selectedState);
    }

    // 3. Region Filter
    if (selectedRegion !== "All") {
      result = result.filter((d) => d.region === selectedRegion);
    }

    setFilteredDevices(result);
  }, [searchQuery, selectedState, selectedRegion, devices]);


  // Extract Unique Values for Dropdowns
  const uniqueStates = Array.from(new Set(devices.map(d => d.state).filter(Boolean))).sort();
  const uniqueRegions = Array.from(new Set(devices.map(d => d.region).filter(Boolean))).sort();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Devices Inventory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Search and filter all registered devices in the system
        </p>

        {/* --- FILTERS --- */}
        <div className="mt-6 glass-panel p-5 rounded-2xl flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Device ID, Branch, or District..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
              />
            </div>
          </div>

          {/* State Filter */}
          <div className="w-48">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
            >
              <option value="All" className="dark:bg-slate-900">All States</option>
              {uniqueStates.map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
            </select>
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
              {uniqueRegions.map(r => <option key={r} value={r} className="dark:bg-slate-900">{r}</option>)}
            </select>
          </div>

          {/* Reset */}
          <div className="pt-6">
            <button
              onClick={() => { setSearchQuery(""); setSelectedState("All"); setSelectedRegion("All"); }}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors px-4 py-2 rounded-lg hover:bg-emerald-500/10"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 glass-panel rounded-2xl mt-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading devices...</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Device ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">District</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      <div className="text-4xl mb-4 opacity-50">🔍</div>
                      No devices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={device.device_id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{device.device_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{device.branch_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          {device.region || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{device.district}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{device.state}</td>
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
