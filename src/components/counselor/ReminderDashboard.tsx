'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Eye, Pencil, Trash2, AlertTriangle, Clock, CheckCircle2, RotateCcw, ChevronDown, Flame, Sun, Snowflake } from 'lucide-react';
import { ReminderService, ReminderResponseDTO, PagedReminders } from '@/services/reminderService';
import ReminderModal from './ReminderModal';
import LoadingButton from '@/components/ui/LoadingButton';
import { toast } from 'react-hot-toast';

type TabType = 'DUE' | 'MISSED' | 'PENDING' | 'ALL';
type ScoreFilter = 'ALL' | 'HOT' | 'WARM' | 'COLD' | 'INTERESTED' | 'DISCARDED';

const SCORE_COLORS: Record<string, string> = {
    'HOT': 'bg-rose-50 text-rose-600 border-rose-200',
    'WARM': 'bg-amber-50 text-amber-600 border-amber-200',
    'COLD': 'bg-sky-50 text-sky-600 border-sky-200',
    'INTERESTED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'DISCARDED': 'bg-slate-50 text-slate-500 border-slate-200',
};

const SCORE_ICONS: Record<string, React.ReactNode> = {
    'HOT': <Flame className="w-3.5 h-3.5" />,
    'WARM': <Sun className="w-3.5 h-3.5" />,
    'COLD': <Snowflake className="w-3.5 h-3.5" />,
};

const TAB_CONFIG: Record<TabType, { label: string; icon: React.ReactNode; color: string; activeColor: string }> = {
    DUE: {
        label: 'Due',
        icon: <Bell className="w-3.5 h-3.5" />,
        color: 'text-rose-500',
        activeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    MISSED: {
        label: 'Missed',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        color: 'text-amber-500',
        activeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PENDING: {
        label: 'Pending',
        icon: <Clock className="w-3.5 h-3.5" />,
        color: 'text-sky-500',
        activeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    ALL: {
        label: 'All',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: 'text-slate-500',
        activeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
};

const PAGE_SIZE = 10;

export default function ReminderDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('DUE');
    const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('ALL');
    const [reminders, setReminders] = useState<ReminderResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Tab counts
    const [dueCt, setDueCt] = useState(0);
    const [missedCt, setMissedCt] = useState(0);
    const [pendingCt, setPendingCt] = useState(0);

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<ReminderResponseDTO | null>(null);

    // Cancel confirmation
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    // Action processing
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Fetch tab counts (lightweight: page 0 size 1)
    const fetchCounts = useCallback(async () => {
        try {
            const [dueRes, missedRes, pendingRes] = await Promise.all([
                ReminderService.getMyDueReminders(0, 1),
                ReminderService.getMyMissedReminders(0, 1),
                ReminderService.getMyPendingReminders(0, 1),
            ]);
            setDueCt((dueRes as any)?.totalElements ?? 0);
            setMissedCt((missedRes as any)?.totalElements ?? 0);
            setPendingCt((pendingRes as any)?.totalElements ?? 0);
        } catch {
            // Silently fail on counts — non-critical
        }
    }, []);

    // Fetch reminders for the active tab
    const fetchReminders = useCallback(async () => {
        setLoading(true);
        try {
            let raw: any;

            if (scoreFilter !== 'ALL') {
                raw = await ReminderService.getRemindersByScore(scoreFilter, page, PAGE_SIZE);
            } else {
                switch (activeTab) {
                    case 'DUE':
                        raw = await ReminderService.getMyDueReminders(page, PAGE_SIZE);
                        break;
                    case 'MISSED':
                        raw = await ReminderService.getMyMissedReminders(page, PAGE_SIZE);
                        break;
                    case 'PENDING':
                        raw = await ReminderService.getMyPendingReminders(page, PAGE_SIZE);
                        break;
                    case 'ALL':
                    default:
                        raw = await ReminderService.getMyReminders(page, PAGE_SIZE);
                        break;
                }
            }

            // Normalize Spring Page response
            const content = raw?.content ?? (Array.isArray(raw) ? raw : []);
            setReminders(content);
            setTotalPages(raw?.totalPages ?? 1);
            setTotalElements(raw?.totalElements ?? content.length);
        } catch (err) {
            console.error('Failed to load reminders:', err);
            setReminders([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, scoreFilter, page]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    // Reset page when tab or filter changes
    useEffect(() => {
        setPage(0);
    }, [activeTab, scoreFilter]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleMarkSeen = async (id: number) => {
        setProcessingId(id);
        try {
            await ReminderService.markAsSeen(id);
            fetchReminders();
            fetchCounts();
        } catch {
            // Error toast handled by api.ts
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (id: number) => {
        setProcessingId(id);
        try {
            await ReminderService.cancelReminder(id);
            setCancellingId(null);
            fetchReminders();
            fetchCounts();
        } catch {
            // Error toast handled by api.ts
        } finally {
            setProcessingId(null);
        }
    };

    const handleEditClick = (reminder: ReminderResponseDTO) => {
        setEditingReminder(reminder);
        setEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setEditModalOpen(false);
        setEditingReminder(null);
        fetchReminders();
        fetchCounts();
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const formatDateTime = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return iso;
        }
    };

    const getStatusBadge = (reminder: ReminderResponseDTO) => {
        if (reminder.seen) return { label: 'Seen', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        if (reminder.status === 'CANCELLED') return { label: 'Cancelled', class: 'bg-slate-50 text-slate-400 border-slate-200' };
        if (reminder.status === 'MISSED') return { label: 'Missed', class: 'bg-red-50 text-red-600 border-red-200' };
        if (reminder.status === 'DUE') return { label: 'Due Now', class: 'bg-rose-50 text-rose-600 border-rose-200' };
        return { label: 'Pending', class: 'bg-sky-50 text-sky-600 border-sky-200' };
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#4d0101]/5 text-[#4d0101] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#4d0101]/10">
                            Follow-ups
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            My Schedule
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                        My Reminders
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight text-sm">Track and manage your follow-up schedule</p>
                </div>
                <button
                    onClick={() => { fetchReminders(); fetchCounts(); }}
                    className="p-3 text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md"
                    title="Refresh"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full overflow-x-auto no-scrollbar">
                {(Object.keys(TAB_CONFIG) as TabType[]).map(tab => {
                    const cfg = TAB_CONFIG[tab];
                    const isActive = activeTab === tab && scoreFilter === 'ALL';
                    const count = tab === 'DUE' ? dueCt : tab === 'MISSED' ? missedCt : tab === 'PENDING' ? pendingCt : null;

                    return (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setScoreFilter('ALL'); }}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                                isActive
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                        >
                            <span className={isActive ? cfg.color : ''}>{cfg.icon}</span>
                            {cfg.label}
                            {count !== null && count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                                    isActive ? cfg.activeColor : 'bg-slate-200/60 text-slate-400'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Score Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Score:</span>
                {(['ALL', 'HOT', 'WARM', 'COLD'] as ScoreFilter[]).map(score => (
                    <button
                        key={score}
                        onClick={() => setScoreFilter(score)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            scoreFilter === score
                                ? (score === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : (SCORE_COLORS[score] || 'bg-slate-100 text-slate-600 border-slate-200'))
                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                    >
                        {SCORE_ICONS[score] && <span>{SCORE_ICONS[score]}</span>}
                        {score}
                    </button>
                ))}
            </div>

            {/* Reminders List */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                {/* List Header */}
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-[#4d0101] rounded-full" />
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {scoreFilter !== 'ALL' ? `${scoreFilter} Reminders` : `${TAB_CONFIG[activeTab].label} Reminders`}
                            </h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {totalElements} total • Page {page + 1} of {totalPages || 1}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#4d0101] rounded-full animate-spin" />
                    </div>
                ) : reminders.length === 0 ? (
                    /* Empty State */
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100">
                            <Bell className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Reminders</h3>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">
                            {activeTab === 'DUE' ? 'No due follow-ups right now' :
                             activeTab === 'MISSED' ? 'Great — nothing missed!' :
                             activeTab === 'PENDING' ? 'No upcoming reminders scheduled' :
                             'Your reminder history is empty'}
                        </p>
                    </div>
                ) : (
                    /* Reminder Cards */
                    <div className="divide-y divide-slate-50">
                        {reminders.map(reminder => {
                            const statusBadge = getStatusBadge(reminder);
                            const score = reminder.score || 'N/A';
                            const isCancelling = cancellingId === reminder.id;
                            const isProcessing = processingId === reminder.id;

                            return (
                                <div key={reminder.id} className="group transition-all hover:bg-slate-50/50">
                                    <div className="px-6 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-4 relative">
                                        {/* Left accent */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                                            reminder.status === 'MISSED' ? 'bg-red-400' :
                                            reminder.status === 'DUE' ? 'bg-rose-400' :
                                            'bg-transparent group-hover:bg-[#4d0101]'
                                        }`} />

                                        {/* Score Icon */}
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${SCORE_COLORS[score] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {SCORE_ICONS[score] || <Bell className="w-4 h-4" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                                                    {reminder.leadName || `Lead #${reminder.leadId}`}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${statusBadge.class}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </div>
                                            {reminder.note && (
                                                <p className="text-[11px] font-medium text-slate-500 mt-1 truncate max-w-[300px]">
                                                    &ldquo;{reminder.note}&rdquo;
                                                </p>
                                            )}
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                {formatDateTime(reminder.reminderTime)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isCancelling ? (
                                                /* Cancel Confirmation */
                                                <div className="flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 animate-in fade-in duration-200">
                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Cancel?</span>
                                                    <LoadingButton
                                                        loading={isProcessing}
                                                        loadingText="..."
                                                        onClick={() => handleCancel(reminder.id)}
                                                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                                                    >
                                                        Yes
                                                    </LoadingButton>
                                                    <button
                                                        onClick={() => setCancellingId(null)}
                                                        className="px-3 py-1.5 bg-white text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Mark Seen (only for DUE reminders that haven't been seen) */}
                                                    {!reminder.seen && reminder.status !== 'CANCELLED' && (reminder.status === 'DUE' || reminder.status === 'MISSED') && (
                                                        <LoadingButton
                                                            loading={isProcessing}
                                                            loadingText=""
                                                            onClick={() => handleMarkSeen(reminder.id)}
                                                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all"
                                                            title="Mark as Seen"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </LoadingButton>
                                                    )}

                                                    {/* Edit (only for non-cancelled, non-seen) */}
                                                    {reminder.status !== 'CANCELLED' && !reminder.seen && (
                                                        <button
                                                            onClick={() => handleEditClick(reminder)}
                                                            className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-200 hover:bg-sky-100 transition-all"
                                                            title="Edit Reminder"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {/* Cancel (only for non-cancelled) */}
                                                    {reminder.status !== 'CANCELLED' && !reminder.seen && (
                                                        <button
                                                            onClick={() => setCancellingId(reminder.id)}
                                                            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-200 hover:bg-rose-100 transition-all"
                                                            title="Cancel Reminder"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && reminders.length > 0 && (
                    <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Page {page + 1} of {totalPages || 1} • {totalElements} reminders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={page === 0}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600 shadow-sm"
                            >
                                ← Prev
                            </button>
                            <span className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center bg-white border border-slate-100 rounded-xl shadow-sm">
                                {page + 1} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => { setPage(p => Math.min(Math.max(0, totalPages - 1), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={page >= (totalPages - 1)}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600 shadow-sm"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingReminder && (
                <ReminderModal
                    isOpen={editModalOpen}
                    onClose={() => { setEditModalOpen(false); setEditingReminder(null); }}
                    leadId={editingReminder.leadId}
                    leadName={editingReminder.leadName || `Lead #${editingReminder.leadId}`}
                    leadScore={editingReminder.score || 'N/A'}
                    existingReminder={editingReminder}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}
