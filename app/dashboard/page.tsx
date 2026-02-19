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
    textColor,
    isCurrency = false
  }: {
    title: string;
    value: number;
    icon: string;
    gradient: string;
    textColor: string;
    isCurrency?: boolean;
  }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:opacity-20 transition-opacity duration-500`}></div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
          <p className={`text-3xl font-extrabold ${textColor} dark:text-gray-100 tracking-tight`}>
            {isCurrency ? `₹${value.toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${gradient} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({
    title,
    desc,
    icon,
    colorClass,
    onClick
  }: {
    title: string;
    desc: string;
    icon: string;
    colorClass: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="bg-white/70 dark:bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-white/60 dark:border-white/10 hover:shadow-xl hover:border-green-500/30 dark:hover:border-green-500/30 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
      <div className="flex items-start gap-4 relaitve z-10">
        <div className={`p-3 rounded-2xl text-3xl shadow-sm ${colorClass} bg-opacity-10 dark:bg-opacity-20 text-opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-green-500 dark:text-green-400">
        →
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Overview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Real-time insights and quick actions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Gathering insights...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Total Devices"
              value={totalDevices}
              icon="📱"
              gradient="bg-blue-500"
              textColor="text-blue-600"
            />
            <StatCard
              title="Total Agents"
              value={totalAgents}
              icon="👥"
              gradient="bg-purple-500"
              textColor="text-purple-600"
            />
            <StatCard
              title="Monthly Payout"
              value={monthlyCommission}
              icon="💰"
              gradient="bg-teal-500"
              textColor="text-teal-600"
              isCurrency={true}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals}
              icon="⏳"
              gradient="bg-amber-500"
              textColor="text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Today's Txns"
              value={todaysPerformance}
              icon="📊"
              gradient="bg-indigo-500"
              textColor="text-indigo-600"
            />
            <StatCard
              title="Active Agents"
              value={activeAgents}
              icon="🟢"
              gradient="bg-green-500"
              textColor="text-green-600"
            />
            <StatCard
              title="Inactive Agents"
              value={inactiveAgents}
              icon="🔴"
              gradient="bg-red-500"
              textColor="text-red-600"
            />
          </div>

          {/* Quick Access Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="text-2xl">🚀</span> Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <QuickActionCard
                title="Agent Management"
                desc="Add, view, and manage agent profiles."
                icon="👥"
                colorClass="from-blue-500 to-blue-600"
                onClick={() => router.push('/agents')}
              />

              <QuickActionCard
                title="Device Inventory"
                desc="Track registered devices and locations."
                icon="📱"
                colorClass="from-cyan-500 to-cyan-600"
                onClick={() => router.push('/devices')}
              />

              <QuickActionCard
                title="Daily Performance"
                desc="Upload and process daily transaction logs."
                icon="📤"
                colorClass="from-indigo-500 to-indigo-600"
                onClick={() => router.push('/admin/daily-upload')}
              />

              <QuickActionCard
                title="Commission Upload"
                desc="Calculate monthly payouts from CSV."
                icon="📥"
                colorClass="from-orange-500 to-orange-600"
                onClick={() => router.push('/admin/commission-upload')}
              />

              <QuickActionCard
                title="Approvals"
                desc="Review and approve pending commissions."
                icon="✅"
                colorClass="from-emerald-500 to-emerald-600"
                onClick={() => router.push('/admin/commission-approval')}
              />

              <QuickActionCard
                title="System Health"
                desc="Diagnose data integrity issues."
                icon="🏥"
                colorClass="from-red-500 to-red-600"
                onClick={() => router.push('/admin/system-health')}
              />

              <QuickActionCard
                title="Master Data Sync"
                desc="Sync agent and device data."
                icon="🔄"
                colorClass="from-pink-500 to-pink-600"
                onClick={() => router.push('/admin/master-sync')}
              />

              <QuickActionCard
                title="Upload Logs"
                desc="Audit history of all file uploads."
                icon="📜"
                colorClass="from-slate-500 to-slate-600"
                onClick={() => router.push('/admin/upload-logs')}
              />

              <QuickActionCard
                title="Column Settings"
                desc="Configure CSV mapping rules."
                icon="⚙️"
                colorClass="from-gray-500 to-gray-600"
                onClick={() => router.push('/admin/commission-column-settings')}
              />

            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
