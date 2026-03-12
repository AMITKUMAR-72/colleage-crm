'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MonitorService } from '@/services/monitorService';
import { AuditLogDTO } from '@/types/api';
import {
    Activity, Clock, User, Globe, Info,
    ArrowRight, ChevronDown, ChevronUp, Search, RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import LoadingButton from '@/components/ui/LoadingButton';

export default function AuditMonitor() {
    const [logs, setLogs] = useState<AuditLogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await MonitorService.getAuditLogs(page, 10);
            setLogs(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error('Failed to fetch audit logs');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (action.includes('DELETE')) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600" />
                        System Audit Monitor
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Real-time tracking of all administrative actions and system changes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <LoadingButton
                        loading={loading}
                        onClick={loadLogs}
                        className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                        title="Refresh logs"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </LoadingButton>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by user or action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Modified By</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && logs.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Activity className="w-12 h-12 text-slate-200" />
                                            <p className="text-slate-400 font-bold">No audit logs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.filter(l =>
                                    l.modifiedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    l.action.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 font-mono">
                                                    {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">
                                                    {log.modifiedBy.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{log.modifiedBy}</span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{log.role.replace('ROLE_', '')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.entityType}</span>
                                                <span className="text-sm font-bold text-slate-600">{log.entityId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                                            >
                                                <Info className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Showing Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl border ${getActionColor(selectedLog.action)}`}>
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Change Audit Details</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Log #{selectedLog.id} • {selectedLog.action}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                <ChevronUp className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Request Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-indigo-500" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User & Role</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedLog.modifiedBy} ({selectedLog.role})</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-indigo-500" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request URL</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedLog.requestUrl}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                                            <p className="text-sm font-bold text-slate-700">{format(new Date(selectedLog.timestamp), 'PPP p')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Info className="w-4 h-4 text-indigo-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Agent</p>
                                            <p className="text-xs font-medium text-slate-600 truncate">{selectedLog.userAgent}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* State Diff */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <ArrowRight className="w-5 h-5 text-indigo-500" />
                                    Property Diff
                                </h4>

                                <div className="space-y-3">
                                    {Object.entries(selectedLog.diff).map(([field, values]) => (
                                        <div key={field} className="group border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30">
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{field}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                                <div className="p-4 bg-rose-50/20">
                                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 block">Old State</span>
                                                    <pre className="text-xs font-mono text-rose-700 bg-white/50 p-2 rounded-lg whitespace-pre-wrap">
                                                        {JSON.stringify(values.old, null, 2) || 'null'}
                                                    </pre>
                                                </div>
                                                <div className="p-4 bg-emerald-50/20">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 block">New State</span>
                                                    <pre className="text-xs font-mono text-emerald-700 bg-white/50 p-2 rounded-lg whitespace-pre-wrap">
                                                        {JSON.stringify(values.new, null, 2) || 'null'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(selectedLog.diff).length === 0 && (
                                        <p className="text-center py-6 text-slate-400 font-bold italic text-sm border-2 border-dashed border-slate-100 rounded-3xl">
                                            No explicit field changes detected (likely a direct entity creation or deletion).
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Raw States */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Full Old State</h4>
                                    <pre className="bg-slate-900 text-slate-300 p-6 rounded-[2rem] text-xs font-mono overflow-x-auto border-4 border-slate-800 shadow-xl">
                                        {JSON.stringify(selectedLog.oldState, null, 2)}
                                    </pre>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Full New State</h4>
                                    <pre className="bg-slate-900 text-slate-300 p-6 rounded-[2rem] text-xs font-mono overflow-x-auto border-4 border-slate-800 shadow-xl">
                                        {JSON.stringify(selectedLog.newState, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
