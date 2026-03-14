'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ManagerService } from '@/services/managerService';
import { LeadService } from '@/services/leadService';
import { CounselorService } from '@/services/counselorService';
import { AssignedLeadDTO, CounselorDTO } from '@/types/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import LoadingButton from '@/components/ui/LoadingButton';

// ─── Bulk Reassign Dropdown ──────────────────────────────────────────────────
function BulkReassignButton({ leadIds, onAssigned }: { leadIds: number[]; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<number | null>(null);
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
        const nowOpen = !open;
        setOpen(nowOpen);
        if (nowOpen && counselors.length === 0) {
            setLoading(true);
            try {
                const raw: any = await CounselorService.getAllCounselors();
                const list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];
                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkReassign = async (e: React.MouseEvent, counselorId: number) => {
        e.stopPropagation();
        if (leadIds.length === 0) {
            toast.error('No leads selected');
            return;
        }
        setAssigning(counselorId);
        try {
            await LeadService.bulkReassignLeads(counselorId, leadIds);
            toast.success(`Reassigned ${leadIds.length} leads successfully`);
            setOpen(false);
            onAssigned();
        } catch {
            /* global toast shown by interceptor */
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={handleOpen}
                disabled={leadIds.length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${leadIds.length > 0
                        ? 'bg-[#4d0101] text-white hover:bg-[#600202]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Bulk Reassign {leadIds.length > 0 && `(${leadIds.length})`}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Counselor</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse italic">fetching counselors…</div>
                        ) : counselors.length === 0 ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 italic">No counselors found</div>
                        ) : (
                            counselors.map((c, idx) => (
                                <button
                                    key={c.counselorId ?? idx}
                                    onClick={e => handleBulkReassign(e, c.counselorId)}
                                    disabled={assigning === c.counselorId}
                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#4d0101]">{c.name}</span>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{c.counselorType}</span>
                                    </div>
                                    {assigning === c.counselorId && (
                                        <span className="text-[10px] font-black text-[#4d0101] animate-pulse lowercase italic">saving…</span>
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
    const [initialised, setInitialised] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            console.log(`[AssignedLeadsMonitor] Fetching page ${page}...`);
            const data = await ManagerService.getAllAssignedLeads(page, 10);
            console.log('[AssignedLeadsMonitor] Data received:', data);

            const rawData = data as any;
            let content: any[] = [];
            if (rawData?.content) content = rawData.content;
            else if (rawData?.leads) content = rawData.leads;
            else if (Array.isArray(rawData)) content = rawData;
            else if (rawData && typeof rawData === 'object' && (rawData.name || rawData.id)) content = [rawData];

            const tp = rawData?.totalPages || (content.length > 0 ? 1 : 0);

            setAssignments(content);
            setTotalPages(tp);

            if (!initialised && tp > 1) {
                setInitialised(true);
                setPage(tp - 1);
                return;
            }
            setInitialised(true);
        } catch (error) {
            console.error('[AssignedLeadsMonitor] Error:', error);
            toast.error('Failed to fetch lead assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [page, initialised]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    const toggleSelection = (id: number) => {
        setSelectedLeadIds(prev =>
            prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedLeadIds.length === assignments.length && assignments.length > 0) {
            setSelectedLeadIds([]);
        } else {
            const ids = assignments
                .map(a => (a.lead?.id || (a as any).leadId))
                .filter(id => id != null);
            setSelectedLeadIds(ids);
        }
    };

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
                    <BulkReassignButton
                        leadIds={selectedLeadIds}
                        onAssigned={() => {
                            setSelectedLeadIds([]);
                            loadAssignments();
                        }}
                    />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-[#4d0101]/20 outline-none w-48 md:w-64 font-bold"
                        />
                    </div>
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={assignments.length > 0 && selectedLeadIds.length === assignments.length}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                    />
                                </th>
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
                                    const leadId = a.lead?.id || item.leadId;

                                    return (
                                        <tr key={a.id || item.leadId || idx}
                                            className={`hover:bg-slate-50/50 transition-colors ${selectedLeadIds.includes(leadId) ? 'bg-[#4d0101]/5' : ''}`}
                                            onClick={() => leadId && toggleSelection(leadId)}
                                        >
                                            <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeadIds.includes(leadId)}
                                                    onChange={(e) => { e.stopPropagation(); leadId && toggleSelection(leadId); }}
                                                    className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                                />
                                            </td>
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
                                ← NEWER
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                OLDER →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
