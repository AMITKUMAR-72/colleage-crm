'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerService } from '@/services/managerService';
import { ContactedLeadDTO } from '@/types/api';

import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ContactedLeadsMonitor() {
    const [contacts, setContacts] = useState<ContactedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            console.log(`[ContactedLeadsMonitor] Fetching page ${page}...`);
            const data = await ManagerService.getAllContactedLeads(page, 10);
            console.log('[ContactedLeadsMonitor] Data received:', data);

            // Handle different possible backend response structures
            const content = data?.content || (Array.isArray(data) ? data : []);
            const totalPages = data?.totalPages || 0;

            setContacts(content);
            setTotalPages(totalPages);
        } catch (error) {
            console.error('[ContactedLeadsMonitor] Error:', error);
            toast.error('Failed to fetch contacted leads');
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        Engagement Tracking
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review all counselor-to-lead interactions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Find interactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-48 md:w-64 font-bold"
                        />
                    </div>
                    <button
                        onClick={loadContacts}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-slate-100 text-[10px] font-black uppercase tracking-widest"
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
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20">
                                        <div className="flex justify-center items-center w-full">
                                            <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                                        </div>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest lowercase italic">no contact history found</p>
                                </td>
                            ) : (
                                contacts.filter(c => {
                                    const leadName = c.leadName?.toLowerCase() || '';
                                    const counselorEmail = c.assignedToEmail?.toLowerCase() || '';
                                    const term = searchTerm.toLowerCase();
                                    return leadName.includes(term) || counselorEmail.includes(term);
                                }).map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">
                                                    {c.leadName ? c.leadName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{c.leadName || 'N/A'}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 tracking-tight">ID: {c.leadId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{c.assignedToEmail || 'Unassigned'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Assigned By: {c.assignedByEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {c.assignedAt ? (
                                                        (() => {
                                                            try {
                                                                // Parse standard ISO string or backend LocalDateTime string
                                                                return format(new Date(c.assignedAt), 'MMM dd, yyyy');
                                                                // return format(new Date(c.assignedAt), 'MMM dd, yyyy');
                                                            } catch (e) {
                                                                return 'Invalid Date';
                                                            }
                                                        })()
                                                    ) : 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {c.assignedAt ? (
                                                        (() => {
                                                            try {
                                                                return format(new Date(c.assignedAt), 'HH:mm');
                                                            } catch (e) {
                                                                return '';
                                                            }
                                                        })()
                                                    ) : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${c.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                c.status === 'LOST' || c.status === 'TIMED_OUT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {c.status?.replace(/_/g, ' ') || 'CONTACTED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="group relative inline-block">
                                                <button className="text-[10px] font-black text-slate-300 hover:text-indigo-600 uppercase tracking-widest">
                                                    INFO
                                                </button>
                                                <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none text-left shadow-xl border border-slate-700">
                                                    <p className="font-black text-slate-400 uppercase tracking-widest mb-1">Interaction Details</p>
                                                    <p className="mb-2">{c.notes || 'No specific notes recorded for this engagement.'}</p>
                                                    <p className="text-indigo-400 font-bold italic">Assigner: {c.assignedByEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {page + 1} / {totalPages}
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
