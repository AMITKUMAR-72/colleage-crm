'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadResponseDTO } from '@/types/api';
import { TimeOutService } from '@/services/timeoutService';
import { CounselorService } from '@/services/counselorService';
import { CounselorDTO } from '@/types/api';

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
    IN_A_SESSION: 'bg-violet-100 text-violet-700 border-violet-200',
};

export default function TimeoutLeadInbox() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLeads, setTotalLeads] = useState(0);
    const [filters, setFilters] = useState<TimeoutLeadFilters>({ email: '', name: '', counselorId: '', startDate: '', endDate: '' });

    const [reassigning, setReassigning] = useState<LeadResponseDTO | null>(null);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [isReassignLoading, setIsReassignLoading] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
    const [isBulkReassignModalOpen, setIsBulkReassignModalOpen] = useState(false);

    const handleBulkReassign = async (counselorId: number) => {
        if (selectedLeads.length === 0) return;
        setIsReassignLoading(true);
        try {
            await TimeOutService.bulkReassignTimeoutLeads(counselorId, selectedLeads);
            const counselor = counselors.find(c => c.counselorId === counselorId);
            toast.success(`${selectedLeads.length} leads assigned to counselor: ${counselor?.name || counselorId}`);
            setSelectedLeads([]);
            setIsBulkReassignModalOpen(false);
            fetchLeads();
        } catch (error) {
            toast.error('Failed to reassign leads');
        } finally {
            setIsReassignLoading(false);
        }
    };

    const toggleLeadSelection = (leadId: number) => {
        setSelectedLeads(prev =>
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const toggleAllLeads = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(lead => lead.id));
        }
    };

    const handleReassign = async (counselorId: number) => {
        if (!reassigning) return;
        setIsReassignLoading(true);
        try {
            await TimeOutService.reassignLead(counselorId, reassigning.id, reassigning.email);
            const counselor = counselors.find(c => c.counselorId === counselorId);
            toast.success(`Lead assigned to counselor ${counselor?.name || counselorId}`);
            setReassigning(null);
            fetchLeads();
        } catch (error) {
            toast.error('Failed to reassign lead');
        } finally {
            setIsReassignLoading(false);
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
                setTotalLeads(results.length);
                setPage(0);
            } else {
                const response: any = await TimeOutService.getAllTimedOutLeads(page, 50);

                const newLeads = response.lead || response.content || (Array.isArray(response) ? response : []);
                setLeads(newLeads);

                // Robust pagination info extraction
                const totalCount = response.count ?? response.totalElements ?? response.totalCount ?? response.totalElementsCount ?? 0;
                setTotalLeads(totalCount);

                const PAGE_SIZE = 50;
                const calculatedPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) :
                    (newLeads.length === PAGE_SIZE ? page + 2 : page + 1);
                const tp = response.totalPages || response.pages || calculatedPages;
                setTotalPages(tp);
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
        // Load counselors for picker
        CounselorService.getAllCounselors().then((res: any) => {
            const list = Array.isArray(res) ? res : (res?.counselors || res?.content || res?.data || []);
            setCounselors(list);
        }).catch(() => { });
    }, [fetchLeads]);

    return (
        <div className="space-y-6">
            <TimeoutSearchFilters counselors={counselors} onFilterChange={(f) => setFilters(f)} />

            <div className="glass-card rounded-2xl overflow-hidden mb-12 relative bg-white shadow-sm border border-gray-100">
                <div className="p-4 sm:p-5 border-b border-slate-100/50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="font-black text-slate-800 tracking-tight">Timed-Out Leads Feed</h2>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                {totalLeads} Total • Page {page + 1} of {totalPages}
                            </p>
                        </div>
                        {selectedLeads.length > 0 && (
                            <button
                                onClick={() => setIsBulkReassignModalOpen(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md animate-in fade-in zoom-in"
                            >
                                Bulk Reassign ({selectedLeads.length})
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-bold"
                        >
                            ← Newer
                        </button>
                        <button
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={page >= totalPages - 1 && leads.length < 50}
                            className="flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-bold"
                        >
                            Older →
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center items-center w-full">
                        <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-slate-500 font-medium lowercase italic">no timeout leads found</p>
                    </div>
                ) : (
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100/50 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                            checked={leads.length > 0 && selectedLeads.length === leads.length}
                                            onChange={toggleAllLeads}
                                        />
                                    </th>
                                    <th className="px-4 sm:px-6 py-4">Name</th>
                                    <th className="hidden sm:table-cell px-6 py-4">Contact</th>
                                    <th className="hidden sm:table-cell px-6 py-4">Email</th>
                                    <th className="hidden md:table-cell px-6 py-4">Course</th>
                                    <th className="hidden lg:table-cell px-6 py-4">Counselor</th>
                                    <th className="px-4 sm:px-6 py-4">Status & Time</th>
                                    <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                        <td className="px-4 py-4 text-center">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => toggleLeadSelection(lead.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm">{lead.name || 'not availabe'}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{lead.id}</div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-slate-700 text-sm">{lead.email || 'not availabe'}</span>
                                                <span className="text-xs text-slate-500">{lead.phone || 'not availabe'}</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <div className="flex flex-col gap-1">

                                                <span className="text-xs text-slate-500">{lead.phone || 'not availabe'}</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs">
                                                {typeof lead.course === 'object' ? lead.course.course : (lead.course || 'not availabe')}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {(lead as any).counselor?.name || (lead as any).counselorName || (lead as any).assignedTo?.name || (lead as any).counselorEmail || 'Unassigned'}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {(lead as any).counselor?.counselorTypes?.join(', ') || (lead as any).counselorTypes?.join(', ') || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border w-fit ${STATUS_COLORS[lead.status] || STATUS_COLORS['NEW']}`}>
                                                    {lead.status.replace(/_/g, ' ')}
                                                </span>
                                                <div className="text-[10px]">
                                                    <span className="text-slate-800 font-semibold">{lead.timedOutAt ? new Date(lead.timedOutAt).toLocaleDateString() : '—'}</span>
                                                    <span className="text-slate-500 ml-1">{lead.timedOutAt ? new Date(lead.timedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setReassigning(lead)}
                                                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                            >
                                                REASSIGN
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
            {(reassigning || isBulkReassignModalOpen) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4" onClick={() => { setReassigning(null); setIsBulkReassignModalOpen(false); }}>
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-black text-slate-900 text-lg">{isBulkReassignModalOpen ? 'Bulk Reassign Leads' : 'Reassign Lead'}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {isBulkReassignModalOpen ? `${selectedLeads.length} leads selected` : reassigning?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => { setReassigning(null); setIsBulkReassignModalOpen(false); }}
                                className="px-4 py-2 text-[10px] items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors font-black uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                            {counselors.length > 0 ? (
                                counselors.filter(c => {
                                    if (c.status !== 'AVAILABLE') return false;

                                    // Check if lead course is null for single reassign
                                    if (reassigning) {
                                        const isCourseNull = !reassigning.course || (typeof reassigning.course === 'object' && !(reassigning.course as any).course);
                                        if (isCourseNull && c.counselorTypes?.includes('INTERNAL')) return false;
                                    }

                                    // Check if any selected lead has null course for bulk reassign
                                    if (isBulkReassignModalOpen) {
                                        const hasNullCourse = leads.some(l =>
                                            selectedLeads.includes(l.id) &&
                                            (!l.course || (typeof l.course === 'object' && !(l.course as any).course))
                                        );
                                        if (hasNullCourse && c.counselorTypes?.includes('INTERNAL')) return false;
                                    }

                                    return true;
                                }).map(c => (
                                    <button
                                        key={c.counselorId}
                                        onClick={() => isBulkReassignModalOpen ? handleBulkReassign(Number(c.counselorId)) : handleReassign(Number(c.counselorId))}
                                        disabled={isReassignLoading}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs">
                                                {(c.name || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase">{c.counselorTypes?.join(', ')} • {c.departments?.join(', ')}</span>
                                            </div>
                                        </div>
                                        <div className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">
                                            {c.status}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">No available counselors</p>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => { setReassigning(null); setIsBulkReassignModalOpen(false); }}
                                className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 transition-all uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
