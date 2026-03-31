import React, { useState, useEffect } from 'react';
import { LeadService } from '@/services/leadService';
import { LeadResponseDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function UnverifiedLeadsSidebar() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response: any = await LeadService.getUnverifiedLeads();
            const data = response?.data || response || [];
            setLeads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch unverified leads', error);
            // toast.error('Could not load unverified leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    return (
        <div className="w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col h-fit animate-in fade-in duration-500">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center gap-3">
                <div>
                    <h2 className="font-black text-slate-800 tracking-tight uppercase">Unverified</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        {leads.length} Pending
                    </p>
                </div>
                
                <button
                    onClick={fetchLeads}
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

            <div style={{ maxHeight: '40vh' }} className="overflow-y-auto bg-slate-50/10">
                {loading ? (
                    <div className="py-16 flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="py-14 text-center">
                        <p className="text-slate-400 font-medium lowercase italic text-sm">no leads to verify</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3 font-black">Lead Details</th>
                                <th className="px-5 py-3 font-black text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800 text-sm">{lead.name || 'Unknown'}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate max-w-[150px]">{lead.email}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-400">
                                            <span className="text-[10px] font-bold tracking-wider">
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'New'}
                                            </span>
                                        </div>
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
