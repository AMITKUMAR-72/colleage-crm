'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { LeadResponseDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function DiscardedLeadsList() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await LeadService.getDiscardedLeads();
            setLeads(res || []);
        } catch (err) {
            console.error('[DiscardedLeadsList] Failed to fetch discarded leads', err);
            toast.error('Could not load discarded leads');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="flex-1 min-w-0 w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 h-fit">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-black text-slate-800 tracking-tight">All Discarded Leads</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        {leads.length} Total Discarded
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition"
                >
                    <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Body */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-20 flex flex-col justify-center items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Discarded</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/30">
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Discarded Leads</h3>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Contact</th>
                                <th className="px-5 py-3">Course</th>
                                <th className="px-5 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead: any, idx) => (
                                <tr key={lead.id || idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{lead.name || 'Anonymous'}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">#{lead.id}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-slate-600 text-xs font-medium">{lead.email || '—'}</div>
                                        <div className="text-slate-400 text-[9px] font-bold mt-0.5">{lead.phones?.[0] || lead.phone || '—'}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-xs font-bold text-slate-600">{lead.course || '—'}</div>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">
                                        {lead.discardedAt || lead.createdAt ? new Date(lead.discardedAt || lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
