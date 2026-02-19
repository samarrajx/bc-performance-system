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
          d.device_id.toLowerCase().includes(lowerQuery) ||
          d.branch_name.toLowerCase().includes(lowerQuery) ||
          d.district.toLowerCase().includes(lowerQuery)
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Devices Inventory
        </h1>
        <p className="text-gray-600">
          Search and filter all registered devices in the system
        </p>

        {/* --- FILTERS --- */}
        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Device ID, Branch, or District..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* State Filter */}
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="All">All States</option>
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Region Filter */}
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="All">All Regions</option>
              {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Reset */}
          <div className="pt-5">
            <button
              onClick={() => { setSearchQuery(""); setSelectedState("All"); setSelectedRegion("All"); }}
              className="text-sm text-gray-500 hover:text-red-500 underline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading devices...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Device ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">District</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No devices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={device.device_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.device_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{device.branch_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                          {device.region || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{device.district}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{device.state}</td>
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
