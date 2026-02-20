"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle"; // Assuming this exists from the layout

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="relative z-10 w-full px-6 py-4 flex items-center justify-between glass-panel border-x-0 border-t-0 bg-transparent rounded-none">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 drop-shadow-md" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
            BC Performance
          </span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center">
        <div className="glass-panel p-10 md:p-16 rounded-3xl max-w-3xl mx-auto w-full backdrop-blur-2xl animate-fade-in-up shadow-2xl">

          <div className="mb-10 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold tracking-widest uppercase shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            System Online & Secure
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-800 dark:text-white mb-6 leading-tight">
            Intelligent <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              Performance
            </span> Manager
          </h1>

          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            The powerful, secure, and intuitive command center for Sanjivani Vikas Foundation network operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1 hover:scale-105 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <span>Access Admin Portal</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights beneath the hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full px-4">
          {[
            { icon: "⚡", title: "Real-time Sync", desc: "Instant sync with agent devices." },
            { icon: "🛡️", title: "Secure Access", desc: "Role-based row level security." },
            { icon: "📊", title: "Deep Analytics", desc: "Granular commission reporting." }
          ].map((feat, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-3xl mb-4 p-3 bg-white/10 dark:bg-black/20 rounded-xl shadow-inner">{feat.icon}</div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center glass-panel border-x-0 border-b-0 bg-transparent rounded-none mt-12 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 opacity-80">
          <img src="/logo.svg" alt="Logo" className="w-5 h-5 grayscale" />
          <span className="font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase text-xs">Sanjivani Vikas Foundation</span>
        </div>
        <p className="text-slate-500 dark:text-slate-500 text-xs font-medium">Internal Administration & Network Management Portal</p>
      </footer>
    </div>
  );
}
