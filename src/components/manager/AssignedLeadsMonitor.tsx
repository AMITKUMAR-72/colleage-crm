'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerService } from '@/services/managerService';
import { AssignedLeadDTO } from '@/types/api';

import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AssignedLeadsMonitor() {
    const [assignments, setAssignments] = useState<AssignedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            console.log(`[AssignedLeadsMonitor] Fetching page ${page}...`);
            const data = await ManagerService.getAllAssignedLeads(page, 10);
            console.log('[AssignedLeadsMonitor] Data received:', data);

            // Handle different possible backend response structures
            const rawData = data as any;
            let content: any[] = [];
            if (rawData?.content) content = rawData.content;
            else if (rawData?.leads) content = rawData.leads;
            else if (Array.isArray(rawData)) content = rawData;
            else if (rawData && typeof rawData === 'object' && (rawData.name || rawData.id)) content = [rawData];

            const totalPages = rawData?.totalPages || (content.length > 0 ? 1 : 0);

            setAssignments(content);
            setTotalPages(totalPages);
        } catch (error) {
            console.error('[AssignedLeadsMonitor] Error:', error);
            toast.error('Failed to fetch lead assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        Assignment Management
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Monitor all lead-to-counselor distributions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-green-500 outline-none w-48 md:w-64 font-bold"
                        />
                    </div>
                    <button
                        onClick={loadAssignments}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-green-600 rounded-xl hover:bg-green-50 transition-all border border-slate-100 text-[10px] font-black uppercase tracking-widest"
                    >
                        {loading ? 'SYNCING...' : 'REFRESH'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned At</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20">
                                        <div className="flex justify-center items-center w-full">
                                            <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                                        </div>
                                    </td>
                                </tr>
                            ) : assignments.length === 0 ? (
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest lowercase italic">no assignments found</p>
                                </td>
                            ) : (
                                assignments.filter(a => {
                                    // Handle nested lead, flat lead, and assignment record formats
                                    const item = a as any;
                                    const leadName = (a.lead?.name || item.leadName || item.name || '').toLowerCase();
                                    const counselorName = (a.counselor?.name || item.assignedTo?.name || item.counselorEmail || '').toLowerCase();
                                    const term = searchTerm.toLowerCase();
                                    return leadName.includes(term) || counselorName.includes(term);
                                }).map((a, idx) => {
                                    const item = a as any;
                                    const displayLeadName = a.lead?.name || item.leadName || item.name || 'N/A';
                                    const displayLeadEmail = a.lead?.email || item.email || '';
                                    const displayCounselor = a.counselor?.name || item.assignedTo?.name || item.counselorEmail || 'Unassigned';

                                    return (
                                        <tr key={a.id || item.leadId || idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black border border-orange-100">
                                                        {displayLeadName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{displayLeadName}</span>
                                                        {displayLeadEmail && <span className="text-[10px] font-bold text-slate-400">{displayLeadEmail}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{displayCounselor}</span>
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mt-0.5">
                                                        {a.counselor?.counselorId ? `ID: ${a.counselor.counselorId}` :
                                                            item.campaign?.name ? `Source: ${item.campaign.name}` :
                                                                item.leadId ? `Lead ID: ${item.leadId}` : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {a.assignedAt || (a as any).createdAt ? (
                                                            (() => {
                                                                try {
                                                                    return format(new Date(a.assignedAt || (a as any).createdAt), 'MMM dd, yyyy');
                                                                } catch (e) {
                                                                    return 'N/A';
                                                                }
                                                            })()
                                                        ) : 'Not Assigned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${(a.status || (a as any).status) === 'UNASSIGNED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    (a.status || (a as any).status) === 'LOST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {a.status || (a as any).status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-[10px] font-black text-slate-300 hover:text-green-600 uppercase tracking-widest">
                                                    VIEW
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                PREV
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
