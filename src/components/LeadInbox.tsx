'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadResponseDTO, CampaignDTO } from '@/types/api';
import { LeadService } from '@/services/leadService';
import LeadSearchFilters from './LeadSearchFilters';
import LeadNotes from './LeadNotes';
import toast from 'react-hot-toast';



interface LeadFilters {
    name: string;
    status: string;
    course: string;
    campaign: string;
    score: string;
}

export default function LeadInbox() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<LeadFilters>({ name: '', status: '', course: '', campaign: '', score: '' });

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);

            const hasFilters = Object.values(filters).some(val => val !== '');

            if (hasFilters) {
                const data = await LeadService.searchLeads(filters);
                setLeads(data || []);
                setTotalPages(1);
            } else {
                const pageData = await LeadService.getRecentLeads(page, 10);
                setLeads(pageData.content || []);
                setTotalPages(pageData.totalPages || 1);
            }
        } catch {
            console.error('Failed to fetch leads');
            toast.error('Could not load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const getCourseDisplay = (lead: LeadResponseDTO): string => {
        if (!lead.course) return 'General';
        if (typeof lead.course === 'object') return lead.course.course || 'General';
        return String(lead.course);
    };

    const getCampaignDisplay = (campaign?: CampaignDTO | null): string => {
        if (!campaign) return '—';
        if (typeof campaign === 'object') return campaign.name || '—';
        return String(campaign);
    };

    return (
        <div className="space-y-6">
            <LeadSearchFilters onFilterChange={(f: LeadFilters) => setFilters(f)} />

            <div className="glass-card rounded-2xl overflow-hidden mb-12 relative bg-white shadow-sm border border-gray-100">
                <div className="p-5 border-b border-slate-100/50 bg-slate-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="font-black text-slate-800 tracking-tight">Live Lead Feed</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                            {leads.length} Leads Found • Page {page + 1} of {totalPages}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center items-center w-full">
                        <img src="/raffles-logo.png" alt="Loading" className="h-12 w-auto object-contain animate-spin-y-ease-in" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-gray-500 font-medium">No leads found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Identity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Campaign</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{lead.name}</div>
                                            <div className="text-xs text-slate-500">{lead.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[lead.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {lead.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {getCampaignDisplay(lead.campaign)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${lead.score === 'HOT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                lead.score === 'WARM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                {lead.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedLead(lead)}
                                                className="text-blue-600 font-bold text-xs hover:underline"
                                            >
                                                View & Notes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Lead Details Slide-over */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Lead Details</h2>
                            <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-lg text-blue-900">{selectedLead.name}</h3>
                                <p className="text-blue-600 text-sm">{selectedLead.email}</p>
                                <p className="text-blue-600 text-sm">{selectedLead.phone}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-xl">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Status</label>
                                    <div className={`mt-1 inline-block px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[selectedLead.status] || 'bg-gray-100'}`}>
                                        {selectedLead.status.replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="p-3 border rounded-xl">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Score</label>
                                    <div className="mt-1 font-bold text-gray-700">{selectedLead.score}</div>
                                </div>
                            </div>

                            <div className="p-3 border rounded-xl">
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Details</label>
                                <p className="text-sm"><strong>Course:</strong> {getCourseDisplay(selectedLead)}</p>
                                <p className="text-sm"><strong>Intake:</strong> {selectedLead.intake || 'N/A'}</p>
                                <p className="text-sm"><strong>Address:</strong> {selectedLead.address || 'N/A'}</p>
                            </div>

                            {/* Notes — no counselorEmail needed, uses JWT */}
                            <LeadNotes leadId={selectedLead.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
