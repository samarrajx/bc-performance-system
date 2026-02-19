"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
  const [inactiveAgents, setInactiveAgents] = useState(0);

  // New Metrics
  const [todaysPerformance, setTodaysPerformance] = useState(0); // Total count for today
  const [monthlyCommission, setMonthlyCommission] = useState(0); // Total payout this month
  const [pendingApprovals, setPendingApprovals] = useState(0);

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

      // 1. Fetch Devices Count
      const { count: deviceCount } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true });

      // 2. Fetch Agents Count
      const { count: agentCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true });

      // 3. Active Agents
      const { count: activeCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .eq("active_status", true);

      // 4. Inactive Agents
      const { count: inactiveCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .eq("active_status", false);

      // 5. Today's Performance (Sum of transaction counts)
      // Note: "today" depends on server time or uploaded date. 
      // We'll use the latest available date in DB if today is empty, or just today.
      // For now, let's query for "today".
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: perfData } = await supabase
        .from("daily_performance")
        .select("deposit_count, withdrawal_count, aeps_onus_count, aeps_offus_count")
        .eq("date", todayStr);

      let perfTotal = 0;
      if (perfData) {
        perfTotal = perfData.reduce((acc, curr) => {
          return acc +
            (curr.deposit_count || 0) +
            (curr.withdrawal_count || 0) +
            (curr.aeps_onus_count || 0) +
            (curr.aeps_offus_count || 0);
        }, 0);
      }

      // 6. Monthly Commission (Current Month)
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: commData } = await supabase
        .from("commissions")
        .select("agent_net_payable")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      let commTotal = 0;
      if (commData) {
        commTotal = commData.reduce((acc, curr) => acc + (curr.agent_net_payable || 0), 0);
      }

      // 7. Pending Approvals
      const { count: pendingCount } = await supabase
        .from("commissions")
        .select("*", { count: "exact", head: true })
        .eq("approved", false);


      setTotalDevices(deviceCount || 0);
      setTotalAgents(agentCount || 0);
      setActiveAgents(activeCount || 0);
      setInactiveAgents(inactiveCount || 0);
      setTodaysPerformance(perfTotal);
      setMonthlyCommission(commTotal);
      setPendingApprovals(pendingCount || 0);

      setLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  const StatCard = ({
    title,
    value,
    icon,
    gradient,
    bgColor,
    isCurrency = false
  }: {
    title: string;
    value: number;
    icon: string;
    gradient: string;
    bgColor: string;
    isCurrency?: boolean;
  }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ${bgColor}`}>
      {/* Decorative gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-20 rounded-full -mr-8 -mt-8`}></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{icon}</div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/30 backdrop-blur-sm`}>
            Live
          </div>
        </div>

        <h3 className="text-sm font-medium opacity-90 uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-3xl font-bold truncate">
          {isCurrency ? `₹${value.toLocaleString()}` : value.toLocaleString()}
        </p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of system performance and agent activity
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Devices"
              value={totalDevices}
              icon="📱"
              gradient="bg-gradient-to-br from-cyan-400 to-blue-500"
              bgColor="bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
            />
            <StatCard
              title="Total Agents"
              value={totalAgents}
              icon="👥"
              gradient="bg-gradient-to-br from-purple-400 to-pink-500"
              bgColor="bg-gradient-to-br from-purple-500 to-pink-600 text-white"
            />
            <StatCard
              title="Active Agents"
              value={activeAgents}
              icon="✓"
              gradient="bg-gradient-to-br from-green-400 to-emerald-500"
              bgColor="bg-gradient-to-br from-green-500 to-emerald-600 text-white"
            />
            <StatCard
              title="Inactive Agents"
              value={inactiveAgents}
              icon="⏸"
              gradient="bg-gradient-to-br from-orange-400 to-red-500"
              bgColor="bg-gradient-to-br from-orange-500 to-red-600 text-white"
            />

            {/* New Metrics Row */}
            <StatCard
              title="Today's Txns"
              value={todaysPerformance}
              icon="📊"
              gradient="bg-gradient-to-br from-indigo-400 to-violet-500"
              bgColor="bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
            />
            <StatCard
              title="Monthly Payout"
              value={monthlyCommission}
              icon="💰"
              gradient="bg-gradient-to-br from-teal-400 to-teal-500"
              bgColor="bg-gradient-to-br from-teal-500 to-teal-600 text-white"
              isCurrency={true}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals}
              icon="⏳"
              gradient="bg-gradient-to-br from-yellow-400 to-amber-500"
              bgColor="bg-gradient-to-br from-yellow-500 to-amber-600 text-white"
            />
          </div>

          {/* Quick Access Grid */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Core Management */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/agents')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600 text-2xl group-hover:bg-blue-100 transition">👥</div>
                  <h3 className="font-semibold text-gray-800">Agent Management</h3>
                </div>
                <p className="text-sm text-gray-500">View, add, and manage agents.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/devices')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600 text-2xl group-hover:bg-cyan-100 transition">📱</div>
                  <h3 className="font-semibold text-gray-800">Device Management</h3>
                </div>
                <p className="text-sm text-gray-500">Track and manage registered devices.</p>
              </div>

              {/* Upload Operations */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/daily-upload')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-teal-50 text-teal-600 text-2xl group-hover:bg-teal-100 transition">📤</div>
                  <h3 className="font-semibold text-gray-800">Daily Upload</h3>
                </div>
                <p className="text-sm text-gray-500">Upload daily performance CSVs.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/commission-upload')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-orange-50 text-orange-600 text-2xl group-hover:bg-orange-100 transition">📥</div>
                  <h3 className="font-semibold text-gray-800">Commission Upload</h3>
                </div>
                <p className="text-sm text-gray-500">Upload and calculate commissions.</p>
              </div>

              {/* Commission Management */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/commission-approval')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600 text-2xl group-hover:bg-yellow-100 transition">✅</div>
                  <h3 className="font-semibold text-gray-800">Approvals</h3>
                </div>
                <p className="text-sm text-gray-500">Review and approve commissions.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/commission-column-settings')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-gray-50 text-gray-600 text-2xl group-hover:bg-gray-100 transition">⚙️</div>
                  <h3 className="font-semibold text-gray-800">Column Settings</h3>
                </div>
                <p className="text-sm text-gray-500">Configure CSV column mappings.</p>
              </div>

              {/* System & Reports */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/master-export')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600 text-2xl group-hover:bg-purple-100 transition">💾</div>
                  <h3 className="font-semibold text-gray-800">Master Export</h3>
                </div>
                <p className="text-sm text-gray-500">Export system data to CSV.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/upload-logs')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 text-2xl group-hover:bg-indigo-100 transition">📜</div>
                  <h3 className="font-semibold text-gray-800">Upload Logs</h3>
                </div>
                <p className="text-sm text-gray-500">View history of file uploads.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/system-health')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-2xl group-hover:bg-red-100 transition">🏥</div>
                  <h3 className="font-semibold text-gray-800">System Health</h3>
                </div>
                <p className="text-sm text-gray-500">Check for data inconsistencies.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group" onClick={() => router.push('/admin/master-sync')}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-pink-50 text-pink-600 text-2xl group-hover:bg-pink-100 transition">🔄</div>
                  <h3 className="font-semibold text-gray-800">Master Sync</h3>
                </div>
                <p className="text-sm text-gray-500">Sync Master Data with Agent.</p>
              </div>

            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
