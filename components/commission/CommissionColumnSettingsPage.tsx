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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                            Column Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Configure commission upload column mappings
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition shadow-lg hover:shadow-xl"
                    >
                        {showAddForm ? '✕ Cancel' : '+ Add Column'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-lg border mb-6 ${message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl">{message.type === "success" ? "✓" : "⚠"}</span>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Column</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Column Key (DB field)
                            </label>
                            <input
                                type="text"
                                value={newColumn.column_key}
                                onChange={(e) => setNewColumn({ ...newColumn, column_key: e.target.value })}
                                placeholder="e.g. new_field_name"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                CSV Header Name
                            </label>
                            <input
                                type="text"
                                value={newColumn.csv_header_name}
                                onChange={(e) => setNewColumn({ ...newColumn, csv_header_name: e.target.value })}
                                placeholder="e.g. New Field Header"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={newColumn.display_order}
                                onChange={(e) => setNewColumn({ ...newColumn, display_order: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddColumn}
                        disabled={saving}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                    >
                        {saving ? 'Adding...' : 'Add Column'}
                    </button>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Column Key</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">CSV Header</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Required</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Active</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {settings.map((setting) => (
                                        <tr key={setting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={setting.display_order}
                                                    onChange={(e) => handleUpdate(setting.id, 'display_order', parseInt(e.target.value))}
                                                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 rounded text-sm font-mono">
                                                    {setting.column_key}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
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
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingId(setting.id)}
                                                        className="cursor-pointer text-gray-900 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
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
                                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
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

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> Changes take effect immediately. Required columns must exist in uploaded CSV files.
                            Active columns will be validated and stored. Inactive columns will be ignored during upload.
                        </p>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
