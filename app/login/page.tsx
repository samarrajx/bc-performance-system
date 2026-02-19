"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setErrorMsg("Login failed: No user data returned");
        setLoading(false);
        return;
      }

      // After login, check role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setErrorMsg("Failed to verify user role");
        await supabase.auth.signOut(); // Force logout if role check fails
        setLoading(false);
        return;
      }

      if (profile?.role === "admin") {
        router.push("/dashboard");
      } else {
        await supabase.auth.signOut();
        router.push("/unauthorized");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="w-full max-w-md perspective-1000">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 transform transition-all hover:scale-[1.01] duration-500">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
              <img
                src="/logo.svg"
                alt="SVF Logo"
                className="relative w-24 h-24 mx-auto mb-6 drop-shadow-2xl transform group-hover:rotate-12 transition-transform duration-700 ease-out"
              />
            </div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent mb-2 tracking-tight">
              Admin Portal
            </h2>
            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">Sanjivani Vikas Foundation</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-green-600 transition-colors">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-500 transition-colors">📧</span>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all duration-300 outline-none font-medium text-gray-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-green-600 transition-colors">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-500 transition-colors">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all duration-300 outline-none font-medium text-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-xl flex items-center gap-3 animate-pulse">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-600 text-sm font-semibold">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-500 hover:to-green-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-green-600/30 hover:shadow-green-600/50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} BC Performance System
        </div>
      </div>
    </div>
  );
}
