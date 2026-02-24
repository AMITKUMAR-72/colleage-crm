'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadResponseDTO } from '@/types/api';
import { TimeOutService } from '@/services/timeoutService';
import { CounselorService } from '@/services/counselorService';
import TimeoutSearchFilters, { TimeoutLeadFilters } from './TimeoutSearchFilters';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-amber-100 text-amber-700 border-amber-200',
    TELECALLER_ASSIGNED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    QUALIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    COUNSELOR_ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    EXTERNAL_ASSIGNED: 'bg-violet-100 text-violet-700 border-violet-200',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700 border-amber-200',
    ADMISSION_DONE: 'bg-green-100 text-green-800 border-green-200',
    LOST: 'bg-slate-100 text-slate-700 border-slate-200',
    UNASSIGNED: 'bg-gray-100 text-gray-600 border-gray-200',
    CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200',
    TIMED_OUT: 'bg-rose-100 text-rose-700 border-rose-200',
    REASSIGNED: 'bg-pink-100 text-pink-700 border-pink-200',
};

export default function TimeoutLeadInbox() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<TimeoutLeadFilters>({ email: '', name: '', counselorEmail: '', startDate: '', endDate: '' });

    const [reassignLead, setReassignLead] = useState<LeadResponseDTO | null>(null);
    const [counselorEmailInput, setCounselorEmailInput] = useState('');
    const [foundCounselor, setFoundCounselor] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const handleSearchCounselor = async () => {
        if (!counselorEmailInput) return;
        try {
            setIsSearching(true);
            setFoundCounselor(null);
            const counselor = await CounselorService.getCounselorByEmail(counselorEmailInput);
            if (counselor && counselor.counselorId) {
                setFoundCounselor(counselor);
            } else {
                toast.error('Counselor not found');
            }
        } catch (error) {
            toast.error('Error fetching counselor');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAssignSubmit = async () => {
        if (!foundCounselor || !reassignLead) return;
        try {
            setIsAssigning(true);
            await TimeOutService.reassignLead(foundCounselor.counselorId, reassignLead.id, reassignLead.email);
            toast.success('Lead reassigned successfully');
            setReassignLead(null);
            setCounselorEmailInput('');
            setFoundCounselor(null);
            fetchLeads(); // Refresh feed
        } catch (error) {
            toast.error('Failed to reassign lead');
        } finally {
            setIsAssigning(false);
        }
    };

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);

            const hasFilters = Object.values(filters).some(val => val !== '');

            if (hasFilters) {
                const results = await TimeOutService.searchTimeoutLeads(filters);
                setLeads(results);
                setTotalPages(1);
                setPage(0);
            } else {
                const response: any = await TimeOutService.getAllTimedOutLeads(page, 50);

                const newLeads = response.lead || response.content || (Array.isArray(response) ? response : []);
                setLeads(newLeads);

                const totalCount = response.count ?? response.totalElements ?? 0;
                const calculatedPages = totalCount > 0 ? Math.ceil(totalCount / 50) : 1;
                setTotalPages(response.totalPages || calculatedPages);
            }
        } catch (error) {
            console.error('Failed to fetch timeout leads', error);
            toast.error('Could not load timeout leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return (
        <div className="space-y-6">
            <TimeoutSearchFilters onFilterChange={(f) => setFilters(f)} />

            <div className="glass-card rounded-2xl overflow-hidden mb-12 relative bg-white shadow-sm border border-gray-100">
                <div className="p-5 border-b border-slate-100/50 bg-slate-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="font-black text-slate-800 tracking-tight">Timed-Out Leads Feed</h2>
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
                        <p className="text-gray-500 font-medium">No timeout leads found</p>
                    </div>
                ) : (
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100/50 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Lead Name</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Timed Out At</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm border border-indigo-200/50">
                                                    {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="font-bold text-slate-800">{lead.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-slate-700">{lead.email || '—'}</span>
                                                <span className="text-xs text-slate-500">{lead.phone || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs">
                                                {typeof lead.course === 'object' ? lead.course.course : String(lead.course || '—')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center justify-center px-2 py-1 uppercase text-[10px] font-bold tracking-wider rounded border ${lead.score === 'HOT' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                lead.score === 'WARM' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    'bg-sky-50 text-sky-600 border-sky-200'
                                                }`}>
                                                {lead.score || 'NONE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status] || STATUS_COLORS['NEW']}`}>
                                                {lead.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <span className="text-slate-800 font-semibold">{lead.timedOutAt ? new Date(lead.timedOutAt).toLocaleDateString() : '—'}</span>
                                                <span className="text-slate-500 block">{lead.timedOutAt ? new Date(lead.timedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setReassignLead(lead)}
                                                className="text-indigo-600 font-bold text-xs hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors hover:bg-indigo-100"
                                            >
                                                Reassign →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reassign Modal */}
            {reassignLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black tracking-tight text-gray-900 text-lg">Reassign Lead</h3>
                                <p className="text-xs text-gray-500 font-medium">Find counselor by email to reassign</p>
                            </div>
                            <button onClick={() => setReassignLead(null)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm border rounded-lg p-1.5 transition-colors">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Target Lead</p>
                                <p className="font-bold text-indigo-900">{reassignLead.name}</p>
                                <p className="text-sm text-indigo-700">{reassignLead.email}</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wider">Counselor Email</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="counselor@example.com"
                                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#dbb212] transition-all font-medium"
                                        value={counselorEmailInput}
                                        onChange={(e) => {
                                            setCounselorEmailInput(e.target.value);
                                            setFoundCounselor(null); // reset when typing
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCounselor()}
                                    />
                                    <button
                                        onClick={handleSearchCounselor}
                                        disabled={isSearching || !counselorEmailInput}
                                        className="bg-[#4d0101] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#600202] active:scale-95 transition-all disabled:opacity-70"
                                    >
                                        {isSearching ? '...' : 'Find'}
                                    </button>
                                </div>
                            </div>

                            {foundCounselor && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-xs font-bold text-emerald-600 mb-2 block uppercase tracking-wider">Target Counselor Found</p>
                                    <p className="font-bold text-emerald-900 mb-1">{foundCounselor.name}</p>
                                    <p className="text-sm font-medium text-emerald-700 mb-4">ID: {foundCounselor.counselorId} • Type: {foundCounselor.counselorType}</p>

                                    <button
                                        onClick={handleAssignSubmit}
                                        disabled={isAssigning}
                                        className="w-full bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md flex justify-center items-center"
                                    >
                                        {isAssigning ? 'Reassigning...' : 'Assign to Counselor'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
