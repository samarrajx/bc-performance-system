"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "master": true,
    "commission": true,
    "daily": true,
    "system": true,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const NavItem = ({ label, path, icon, isActive }: { label: string, path: string, icon: string, isActive: boolean }) => (
    <div
      onClick={() => router.push(path)}
      className={`px-4 py-2 ml-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-200 ${isActive
        ? "bg-white/10 text-white font-semibold transform translate-x-1"
        : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
    >
      <span className="text-lg opacity-80">{icon}</span>
      <span>{label}</span>
    </div>
  );

  const GroupHeader = ({ title, id, icon }: { title: string, id: string, icon: string }) => (
    <div
      onClick={() => toggleGroup(id)}
      className="px-4 py-3 mt-2 cursor-pointer flex items-center justify-between group hover:bg-white/5 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3 text-gray-200 font-medium">
        <span className="text-xl">{icon}</span>
        <span>{title}</span>
      </div>
      <span className={`text-xs text-gray-500 transform transition-transform duration-200 ${openGroups[id] ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Modern Sidebar with Gradient */}
      <div className="w-72 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shadow-2xl z-20 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-6 border-b border-white/10 sticky top-0 bg-slate-900 z-10 backdrop-blur-md bg-opacity-90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg transform transition hover:scale-105">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                BC Admin
              </h2>
              <p className="text-xs text-indigo-300 font-medium tracking-wide">Performance Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1 pb-20">
          {/* Dashboard - Standalone */}
          <div
            onClick={() => router.push("/dashboard")}
            className={`px-4 py-3 mb-4 rounded-lg cursor-pointer flex items-center gap-3 transition-all duration-200 ${pathname === "/dashboard"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
          >
            <span className="text-xl">🏠</span>
            <span className="font-semibold">Dashboard</span>
          </div>

          {/* Master Management Group */}
          <GroupHeader title="Master Data" id="master" icon="🗃️" />
          {openGroups["master"] && (
            <div className="space-y-1 mb-2">
              <NavItem label="Agents" path="/agents" icon="👥" isActive={pathname === "/agents"} />
              <NavItem label="Devices" path="/devices" icon="📱" isActive={pathname === "/devices"} />
              <NavItem label="Master Export" path="/admin/master-export" icon="📤" isActive={pathname === "/admin/master-export"} />
              <NavItem label="Master Sync" path="/admin/master-sync" icon="🔄" isActive={pathname === "/admin/master-sync"} />
            </div>
          )}

          {/* Commission Module Group */}
          <GroupHeader title="Commissions" id="commission" icon="💰" />
          {openGroups["commission"] && (
            <div className="space-y-1 mb-2">
              <NavItem label="Upload CSV" path="/admin/commission-upload" icon="📥" isActive={pathname === "/admin/commission-upload"} />
              <NavItem label="Approvals" path="/admin/commission-approval" icon="✓" isActive={pathname === "/admin/commission-approval"} />
              <NavItem label="Column Settings" path="/admin/commission-column-settings" icon="⚙️" isActive={pathname === "/admin/commission-column-settings"} />
            </div>
          )}

          {/* Daily Operations Group */}
          <GroupHeader title="Daily Ops" id="daily" icon="📅" />
          {openGroups["daily"] && (
            <div className="space-y-1 mb-2">
              <NavItem label="Daily Upload" path="/admin/daily-upload" icon="📈" isActive={pathname === "/admin/daily-upload"} />
              <NavItem label="Upload Logs" path="/admin/upload-logs" icon="📝" isActive={pathname === "/admin/upload-logs"} />
            </div>
          )}

          {/* System Tools Group */}
          <GroupHeader title="System Tools" id="system" icon="🛠️" />
          {openGroups["system"] && (
            <div className="space-y-1 mb-2">
              <NavItem label="System Health" path="/admin/system-health" icon="🏥" isActive={pathname === "/admin/system-health"} />
              <NavItem label="Reset Password" path="/admin/reset-password" icon="🔐" isActive={pathname === "/admin/reset-password"} />
            </div>
          )}

        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-white/10 bg-slate-900 sticky bottom-0 z-10">
          <button
            onClick={handleLogout}
            className="w-full bg-white/5 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent px-4 py-3 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:text-red-400 transition-colors">🚪</span>
            <span className="group-hover:text-red-100 transition-colors">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto bg-gray-50 relative z-0">
        {/* Top Bar for Mobile? (Optional, skipping for now as sidebar is fixed) */}
        <div className="max-w-7xl mx-auto p-8 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}
