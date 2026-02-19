"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "../ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Accordion state: only one group open at a time, closed by default
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleGroup = (group: string) => {
    setOpenGroup(prev => (prev === group ? null : group));
  };

  const NavItem = ({ label, path, icon, isActive }: { label: string, path: string, icon: string, isActive: boolean }) => (
    <div
      onClick={() => router.push(path)}
      className={`px-4 py-2.5 ml-2 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 relative group overflow-hidden ${isActive
        ? "bg-green-600/20 text-green-300 font-semibold border-r-2 border-green-500"
        : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
    >
      <span className={`text-lg opacity-80 transition-transform duration-300 ${isActive ? 'scale-110 text-green-400' : 'group-hover:scale-110'}`}>{icon}</span>
      <span className="relative z-10">{label}</span>
      {isActive && <div className="absolute inset-0 bg-green-500/5 blur-sm"></div>}
    </div>
  );

  const GroupHeader = ({ title, id, icon }: { title: string, id: string, icon: string }) => (
    <div
      onClick={() => toggleGroup(id)}
      className="px-4 py-3 mt-4 cursor-pointer flex items-center justify-between group hover:bg-white/5 rounded-xl transition-all duration-300 select-none"
    >
      <div className="flex items-center gap-3 text-gray-300 font-medium group-hover:text-white transition-colors">
        <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{icon}</span>
        <span className="tracking-wide text-sm uppercase font-bold text-gray-500 group-hover:text-gray-300 transition-colors">{title}</span>
      </div>
      <span className={`text-[10px] text-gray-600 transform transition-transform duration-300 ${openGroup === id ? 'rotate-180 text-green-500' : 'group-hover:text-gray-400'}`}>
        ▼
      </span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden font-sans transition-colors duration-300">

      {/* Modern Sidebar with Gradient */}
      <div className="w-72 bg-[#0a270b] dark:bg-[#051a06] text-white flex flex-col shadow-2xl z-20 sticky top-0 h-screen overflow-y-auto custom-scrollbar border-r border-white/5 dark:border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0a270b]/95 dark:bg-[#051a06]/95 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full"></div>
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-12 h-12 relative z-10 drop-shadow-lg transform group-hover:rotate-12 transition-transform duration-500"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide group-hover:text-green-400 transition-colors">
                Manager
              </h2>
              <p className="text-[10px] text-green-400/80 font-semibold tracking-wider uppercase">Admin Console</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2 pb-20">
          {/* Dashboard - Standalone */}
          <div
            onClick={() => router.push("/dashboard")}
            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-300 group ${pathname === "/dashboard"
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/50"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
          >
            <span className={`text-xl transition-transform duration-300 ${pathname === '/dashboard' ? 'scale-110' : 'group-hover:scale-110'}`}>🏠</span>
            <span className="font-semibold tracking-wide">Dashboard</span>
            {pathname === "/dashboard" && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
          </div>

          {/* Master Management Group */}
          <GroupHeader title="Master Data" id="master" icon="🗃️" />
          {openGroup === "master" && (
            <div className="space-y-1 mb-2 pl-2 border-l-2 border-white/5 ml-4 transition-all duration-300">
              <NavItem label="Agents" path="/agents" icon="👥" isActive={pathname === "/agents"} />
              <NavItem label="Devices" path="/devices" icon="📱" isActive={pathname === "/devices"} />
              <NavItem label="Master Export" path="/admin/master-export" icon="📤" isActive={pathname === "/admin/master-export"} />
              <NavItem label="Master Sync" path="/admin/master-sync" icon="🔄" isActive={pathname === "/admin/master-sync"} />
            </div>
          )}

          {/* Commission Module Group */}
          <GroupHeader title="Commissions" id="commission" icon="💰" />
          {openGroup === "commission" && (
            <div className="space-y-1 mb-2 pl-2 border-l-2 border-white/5 ml-4 transition-all duration-300">
              <NavItem label="Upload CSV" path="/admin/commission-upload" icon="📥" isActive={pathname === "/admin/commission-upload"} />
              <NavItem label="Approvals" path="/admin/commission-approval" icon="✓" isActive={pathname === "/admin/commission-approval"} />
              <NavItem label="Column Settings" path="/admin/commission-column-settings" icon="⚙️" isActive={pathname === "/admin/commission-column-settings"} />
            </div>
          )}

          {/* Daily Operations Group */}
          <GroupHeader title="Daily Ops" id="daily" icon="📅" />
          {openGroup === "daily" && (
            <div className="space-y-1 mb-2 pl-2 border-l-2 border-white/5 ml-4 transition-all duration-300">
              <NavItem label="Daily Upload" path="/admin/daily-upload" icon="📈" isActive={pathname === "/admin/daily-upload"} />
              <NavItem label="Upload Logs" path="/admin/upload-logs" icon="📝" isActive={pathname === "/admin/upload-logs"} />
            </div>
          )}

          {/* System Tools Group */}
          <GroupHeader title="System Tools" id="system" icon="🛠️" />
          {openGroup === "system" && (
            <div className="space-y-1 mb-2 pl-2 border-l-2 border-white/5 ml-4 transition-all duration-300">
              <NavItem label="System Health" path="/admin/system-health" icon="🏥" isActive={pathname === "/admin/system-health"} />
              <NavItem label="Reset Password" path="/admin/reset-password" icon="🔐" isActive={pathname === "/admin/reset-password"} />
            </div>
          )}

        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-white/10 bg-slate-900 dark:bg-black sticky bottom-0 z-10 transition-colors duration-300">
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
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a] relative z-0 transition-colors duration-300">
        {/* Top Bar for Mobile? (Optional, skipping for now as sidebar is fixed) */}
        <div className="max-w-7xl mx-auto p-8 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}
