"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import SystemHealthDashboard from "@/components/health/SystemHealthDashboard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SystemHealthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
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
            setLoading(false);
        }
        checkAdmin();
    }, [router]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    System Health Console
                </h1>
                <p className="text-gray-600 mt-2">
                    Monitor data integrity and system consistency.
                </p>
            </div>

            <SystemHealthDashboard />
        </AdminLayout>
    );
}
