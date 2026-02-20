"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/layout/AdminLayout";

interface ColumnSetting {
    id: number;
    column_key: string;
    csv_header_name: string;
    is_required: boolean;
    is_active: boolean;
    display_order: number;
}

export default function CommissionColumnSettingsPage() {
    const [settings, setSettings] = useState<ColumnSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newColumn, setNewColumn] = useState({ column_key: "", csv_header_name: "", display_order: 100 });
    const [showAddForm, setShowAddForm] = useState(false);



    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("commission_column_settings")
                .select("*")
                .order("display_order");

            if (error) throw error;
            setSettings(data || []);
        } catch (error: any) {
            setMessage({ type: "error", text: `Error loading settings: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: number, field: "is_required" | "is_active", currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from("commission_column_settings")
                .update({ [field]: !currentValue })
                .eq("id", id);

            if (error) throw error;

            setSettings(prev =>
                prev.map(s => s.id === id ? { ...s, [field]: !currentValue } : s)
            );

            setMessage({ type: "success", text: "Updated successfully" });
            setTimeout(() => setMessage(null), 2000);
        } catch (error: any) {
            setMessage({ type: "error", text: `Error: ${error.message}` });
        }
    };

    const handleUpdate = async (id: number, field: string, value: string | number) => {
        try {
            const { error } = await supabase
                .from("commission_column_settings")
                .update({ [field]: value })
                .eq("id", id);

            if (error) throw error;

            setSettings(prev =>
                prev.map(s => s.id === id ? { ...s, [field]: value } : s)
            );

            setMessage({ type: "success", text: "Updated successfully" });
            setTimeout(() => setMessage(null), 2000);
        } catch (error: any) {
            setMessage({ type: "error", text: `Error: ${error.message}` });
        }
    };

    const handleAddColumn = async () => {
        if (!newColumn.column_key || !newColumn.csv_header_name) {
            setMessage({ type: "error", text: "Column key and CSV header name are required" });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from("commission_column_settings")
                .insert({
                    column_key: newColumn.column_key,
                    csv_header_name: newColumn.csv_header_name,
                    display_order: newColumn.display_order,
                    is_required: false,
                    is_active: true
                });

            if (error) throw error;

            setMessage({ type: "success", text: "Column added successfully" });
            setNewColumn({ column_key: "", csv_header_name: "", display_order: 100 });
            setShowAddForm(false);
            fetchSettings();
        } catch (error: any) {
            setMessage({ type: "error", text: `Error: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this column setting?")) return;

        try {
            const { error } = await supabase
                .from("commission_column_settings")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setSettings(prev => prev.filter(s => s.id !== id));
            setMessage({ type: "success", text: "Column deleted successfully" });
        } catch (error: any) {
            setMessage({ type: "error", text: `Error: ${error.message}` });
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex justify-between items-center max-w-4xl">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">
                            Column Settings
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Configure commission upload column mappings
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
                    >
                        {showAddForm ? '✕ Cancel' : '+ Add Column'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-2xl border mb-6 ${message.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl">{message.type === "success" ? "✅" : "⚠️"}</span>
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="glass-panel p-6 rounded-3xl mb-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">Add New Column</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Column Key (DB field)
                            </label>
                            <input
                                type="text"
                                value={newColumn.column_key}
                                onChange={(e) => setNewColumn({ ...newColumn, column_key: e.target.value })}
                                placeholder="e.g. new_field_name"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                CSV Header Name
                            </label>
                            <input
                                type="text"
                                value={newColumn.csv_header_name}
                                onChange={(e) => setNewColumn({ ...newColumn, csv_header_name: e.target.value })}
                                placeholder="e.g. New Field Header"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300 placeholder-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={newColumn.display_order}
                                onChange={(e) => setNewColumn({ ...newColumn, display_order: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none font-medium text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddColumn}
                        disabled={saving}
                        className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {saving ? 'Adding...' : 'Add Column'}
                    </button>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-10 glass-panel rounded-2xl mb-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading settings...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border-white/20 dark:border-white/10 mb-6">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Column Key</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">CSV Header</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Required</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Active</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 dark:divide-white/5">
                                    {settings.map((setting) => (
                                        <tr key={setting.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={setting.display_order}
                                                    onChange={(e) => handleUpdate(setting.id, 'display_order', parseInt(e.target.value))}
                                                    className="w-20 px-3 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-lg text-sm font-medium focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="px-3 py-1 bg-slate-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-sm font-bold border border-emerald-500/20">
                                                    {setting.column_key}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                {editingId === setting.id ? (
                                                    <input
                                                        type="text"
                                                        value={setting.csv_header_name}
                                                        onChange={(e) => {
                                                            setSettings(prev =>
                                                                prev.map(s => s.id === setting.id ? { ...s, csv_header_name: e.target.value } : s)
                                                            );
                                                        }}
                                                        onBlur={() => {
                                                            handleUpdate(setting.id, 'csv_header_name', setting.csv_header_name);
                                                            setEditingId(null);
                                                        }}
                                                        autoFocus
                                                        className="w-full px-3 py-2 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-lg text-sm focus:bg-white/80 dark:focus:bg-black/80 focus:ring-2 focus:ring-emerald-500/50 outline-none text-slate-800 dark:text-slate-200 shadow-inner transition-all duration-300"
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingId(setting.id)}
                                                        className="cursor-pointer text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border-b border-dashed border-slate-400 dark:border-slate-600 pb-0.5"
                                                        title="Click to edit"
                                                    >
                                                        {setting.csv_header_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={setting.is_required}
                                                        onChange={() => handleToggle(setting.id, 'is_required', setting.is_required)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300/50 dark:bg-slate-700/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={setting.is_active}
                                                        onChange={() => handleToggle(setting.id, 'is_active', setting.is_active)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300/50 dark:bg-slate-700/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-panel border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-6">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-3">
                            <span className="text-xl">ℹ️</span>
                            <span>
                                <strong className="text-slate-900 dark:text-white block mb-1">Note</strong>
                                Changes take effect immediately. Required columns must exist in uploaded CSV files.
                                Active columns will be validated and stored. Inactive columns will be ignored during upload.
                            </span>
                        </p>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
