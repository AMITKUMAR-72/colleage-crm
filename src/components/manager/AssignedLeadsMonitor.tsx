'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ManagerService } from '@/services/managerService';
import { LeadService } from '@/services/leadService';
import { CounselorService } from '@/services/counselorService';
import { AssignedLeadDTO, CounselorDTO, LeadStatus } from '@/types/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import LoadingButton from '@/components/ui/LoadingButton';
import api from '@/services/api';
import LeadNotes from '@/components/LeadNotes';

// ─── Lead Notes Modal ────────────────────────────────────────────────────────
function LeadNotesModal({ leadId, onClose }: { leadId: string | number; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Lead Activity & Notes</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Complete history for ID: {leadId}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors group"
                    >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    <LeadNotes leadId={leadId} />
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Manual Assign Button (Single Row) ──────────────────────────────────
function ManualAssignButton({ leadId, onAssigned }: { leadId: string | number; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        if (!open && counselors.length === 0) {
            setLoading(true);
            try {
                const raw: any = await CounselorService.getAllCounselors();
                const list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : (raw?.counselors ?? raw?.data ?? raw?.content) || [];
                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReassign = async (e: React.MouseEvent, counselorId: string | number) => {
        e.stopPropagation();
        setAssigning(String(counselorId));
        try {
            // #21 - Manual Assign (Using standard assign endpoint as requested)
            await LeadService.assignLeadToCounselor(leadId, counselorId);
            toast.success('Lead assigned successfully');
            setOpen(false);
            onAssigned();
        } catch {
            // Managed by interceptor
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={handleOpen}
                    className="flex shadow-sm items-center gap-1.5 px-3 py-1.5 bg-[#4d0101] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#600202] transition-all"
                >
                    Assign
                </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Counselor</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center italic text-slate-300 text-[10px] font-bold animate-pulse">loading…</div>
                        ) : (
                            counselors.map(c => (
                                <button
                                    key={c.counselorId}
                                    onClick={e => handleReassign(e, c.counselorId)}
                                    disabled={!!assigning}
                                    className="w-full px-4 py-2.5 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 text-left flex items-center justify-between group"
                                >
                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">{c.name}</span>
                                    {assigning === String(c.counselorId) ? (
                                        <div className="w-3 h-3 border-2 border-slate-200 border-t-[#4d0101] rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{c.counselorId}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AssignedLeadsMonitor() {
    const [assignments, setAssignments] = useState<AssignedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewLeadId, setViewLeadId] = useState<string | number | null>(null);

    // ─── Filter States ────────────────────────────────────────────────────────
    const [filterType, setFilterType] = useState<'ALL' | 'COUNSELOR' | 'LEAD_NAME'>('ALL');
    const [filterValue, setFilterValue] = useState('');
    const [isPagingEnabled, setIsPagingEnabled] = useState(true);
    const [allCounselors, setAllCounselors] = useState<CounselorDTO[]>([]);

    useEffect(() => {
        const fetchCounselors = async () => {
            try {
                const raw: any = await CounselorService.getAllCounselors();
                const list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];
                setAllCounselors(list);
            } catch (err) {
                console.error('Failed to load counselors for filter', err);
            }
        };
        fetchCounselors();
    }, []);

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            let data: any;

            if (filterType === 'ALL' || (!filterValue && filterType !== 'DATE_RANGE')) {
                data = await ManagerService.getAllAssignedLeads(page, 10);
                setIsPagingEnabled(true);
            } else {
                setIsPagingEnabled(false);
                switch (filterType) {
                    case 'COUNSELOR':
                        data = await ManagerService.getAssignmentsByCounselor(filterValue);
                        break;
                    case 'LEAD_NAME':
                        data = await ManagerService.getAssignmentsByLeadName(filterValue);
                        break;
                }
            }

            const content = data?.content || (Array.isArray(data) ? data : []);
            const tp = data?.totalPages || (content.length > 0 ? (isPagingEnabled ? data.totalPages : 1) : 0);

            setAssignments(content);
            setTotalPages(tp || (content.length > 0 ? 1 : 0));
        } catch (error) {
            console.error('[AssignedLeadsMonitor] Error:', error);
            toast.error('Failed to fetch lead assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterValue, isPagingEnabled]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadAssignments();
    };

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
                <div className="flex items-center gap-3">
                    <LoadingButton
                        loading={loading}
                        loadingText="SYNCING..."
                        onClick={loadAssignments}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-[#4d0101] rounded-xl hover:bg-[#4d0101]/5 transition-all border border-slate-100 text-[10px] font-black uppercase tracking-widest"
                    >
                        REFRESH
                    </LoadingButton>
                </div>
            </div>

            {/* ─── Filters Bar ──────────────────────────────────────────────── */}
            <form onSubmit={handleFilterSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter By</label>
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value as any);
                            setFilterValue('');
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10"
                    >
                        <option value="ALL">Show All (Default)</option>
                        <option value="LEAD_NAME">Lead Name</option>
                        <option value="COUNSELOR">Counselor</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Value</label>
                    {filterType === 'COUNSELOR' ? (
                        <select
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10"
                        >
                            <option value="">Select Counselor</option>
                            {allCounselors.map(c => (
                                <option key={c.counselorId} value={c.counselorId}>
                                    {c.name} ({c.counselorTypes?.join(', ')})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            placeholder={filterType === 'ALL' ? "Search in results below..." : `Enter ${filterType.replace('_', ' ').toLowerCase()}...`}
                            value={searchTerm || filterValue}
                            onChange={(e) => {
                                if (filterType === 'ALL') setSearchTerm(e.target.value);
                                else setFilterValue(e.target.value);
                            }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10 font-mono"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex-1 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95"
                    >
                        Apply Filter
                    </button>
                    {(filterValue || filterType !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilterType('ALL');
                                setFilterValue('');
                                setSearchTerm('');
                                setPage(0);
                            }}
                            className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

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
                                    <td colSpan={6} className="py-20">
                                        <div className="flex justify-center items-center w-full">
                                            <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-[#4d0101] rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest italic">no assignments found</p>
                                    </td>
                                </tr>
                            ) : (
                                assignments.filter(a => {
                                    if (filterType !== 'ALL') return true;
                                    const item = a as any;
                                    const leadName = (a.lead?.name || item.leadName || item.name || '').toLowerCase();
                                    const counselorName = (a.counselor?.name || item.assignedTo?.name || item.counselorEmail || '').toLowerCase();
                                    const term = searchTerm.toLowerCase();
                                    return leadName.includes(term) || counselorName.includes(term);
                                }).map((a, idx) => {
                                    const item = a as any;
                                    const displayLeadName = a.lead?.name || item.leadName || item.name || 'N/A';
                                    const displayLeadEmail = a.lead?.email || item.leadEmail || item.email || '';
                                    const displayCounselor = a.counselor?.name || item.counselorName || item.assignedTo?.name || item.counselorEmail || 'Unassigned';
                                    const leadId = a.lead?.id || item.leadId;
                                    const counselorIdDisplay = a.counselor?.counselorId || item.counselorId;

                                    return (
                                        <tr key={a.id || item.leadId || idx}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
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
                                                    {item.campaign?.name && (
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mt-0.5">
                                                            Source: {item.campaign.name}
                                                        </span>
                                                    )}
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
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => leadId && setViewLeadId(leadId)}
                                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                                                    >
                                                        VIEW
                                                    </button>
                                                    {leadId && <ManualAssignButton leadId={leadId} onAssigned={loadAssignments} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
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

            {viewLeadId && (
                <LeadNotesModal 
                    leadId={viewLeadId} 
                    onClose={() => setViewLeadId(null)} 
                />
            )}
        </div>
    );
}
