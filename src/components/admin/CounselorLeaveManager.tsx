'use client';

import { useState, useEffect, useCallback } from 'react';
import { CounselorDTO } from '@/types/api';
import { CounselorService } from '@/services/counselorService';
import { LeaveService, LeaveRequestDTO as LeaveDTO } from '@/services/leaveService';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, CheckCircle, XCircle, Clock, ChevronRight, UserCircle, Briefcase, Mail, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CounselorLeaveManager() {
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [selectedCounselorId, setSelectedCounselorId] = useState<number | null>(null);
    const [leaves, setLeaves] = useState<LeaveDTO[]>([]);
    const [counselorsLoading, setCounselorsLoading] = useState(true);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [updatingLeaveId, setUpdatingLeaveId] = useState<number | null>(null);
    const [editingDatesId, setEditingDatesId] = useState<number | null>(null);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [allLeaves, setAllLeaves] = useState<LeaveDTO[]>([]);
    const [allLeavesLoading, setAllLeavesLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const leavesPerPage = 10;

    const fetchCounselors = useCallback(async () => {
        setCounselorsLoading(true);
        try {
            const data: any = await CounselorService.getAllCounselors();
            const list = Array.isArray(data) ? data : data?.counselors ?? data?.data ?? data?.content ?? [];
            setCounselors(list);
        } catch (error) {
            console.error('Failed to fetch counselors:', error);
            toast.error('Could not load counselors');
        } finally {
            setCounselorsLoading(false);
        }
    }, []);

    const fetchLeaves = useCallback(async (counselorId: number) => {
        setLeavesLoading(true);
        try {
            const data: any = await LeaveService.getCounselorLeaves(counselorId);
            setLeaves(Array.isArray(data) ? data : data?.data || []);
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
            toast.error('Could not load leave records');
        } finally {
            setLeavesLoading(false);
        }
    }, []);

    const fetchAllLeaves = useCallback(async () => {
        setAllLeavesLoading(true);
        try {
            const data: any = await LeaveService.getAllLeaves();
            setAllLeaves(Array.isArray(data) ? data : data?.data || []);
        } catch (error) {
            console.error('Failed to fetch all leaves:', error);
        } finally {
            setAllLeavesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounselors();
        fetchAllLeaves();
    }, [fetchCounselors, fetchAllLeaves]);

    useEffect(() => {
        if (selectedCounselorId) {
            fetchLeaves(selectedCounselorId);
        } else {
            setLeaves([]);
        }
    }, [selectedCounselorId, fetchLeaves]);

    const handleUpdateStatus = async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
        setUpdatingLeaveId(leaveId);
        try {
            await LeaveService.updateLeaveStatus(leaveId, status);
            toast.success(`Leave ${status.toLowerCase()} successfully`);
            if (selectedCounselorId) fetchLeaves(selectedCounselorId);
        } catch (error) {
            console.error('Failed to update leave status:', error);
        } finally {
            setUpdatingLeaveId(null);
        }
    };

    const handleUpdateDates = async (leaveId: number) => {
        if (!editStartDate || !editEndDate) {
            toast.error('Dates cannot be empty');
            return;
        }
        setUpdatingLeaveId(leaveId);
        try {
            await LeaveService.updateLeaveDates(leaveId, { startDate: editStartDate, endDate: editEndDate });
            toast.success('Leave dates updated successfully');
            setEditingDatesId(null);
            if (selectedCounselorId) fetchLeaves(selectedCounselorId);
        } catch (error) {
            console.error('Failed to update leave dates:', error);
        } finally {
            setUpdatingLeaveId(null);
        }
    };

    const startEditing = (leave: LeaveDTO) => {
        setEditingDatesId(leave.id!);
        setEditStartDate(leave.startDate);
        setEditEndDate(leave.endDate);
    };

    const selectedCounselor = counselors.find(c => c.counselorId === selectedCounselorId);

    return (
        <div className="space-y-16">
            {/* 1. Global Monitoring Section */}
            <section className="relative">
                <div className="flex items-center gap-4 mb-6 px-4">
                    <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
                    <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">System Overview</h2>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">All Leave Feed</h3>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-1 px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Monitoring</span>
                        </div>
                        <div className="flex items-center gap-2 py-4">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">
                                {allLeaves.length} TOTAL RECORDS
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        {allLeavesLoading ? (
                            <div className="py-12 text-center">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updating feed…</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {allLeaves.slice((currentPage - 1) * leavesPerPage, currentPage * leavesPerPage).map((l, i) => (
                                    <div key={l.id || i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-200 hover:bg-indigo-50/10 transition-all cursor-default">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-2.5 h-2.5 rounded-full ${l.status === 'APPROVED' ? 'bg-emerald-500' :
                                                l.status === 'REJECTED' ? 'bg-rose-500' :
                                                    'bg-amber-500'
                                                }`} />
                                            <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{l.reason}</p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {l.startDate} → {l.endDate}
                                            </div>
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {l.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {allLeaves.length > leavesPerPage && (
                            <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-100 pt-6">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Page {currentPage} of {Math.ceil(allLeaves.length / leavesPerPage)}</span>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= Math.ceil(allLeaves.length / leavesPerPage)}
                                    className="px-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <hr className="border-slate-100 border-t-2 border-dashed mx-10" />

            {/* 2. Directory & Audit Section */}
            <section className="lg:col-span-12 space-y-8">
                <AnimatePresence mode="wait">
                    {!selectedCounselorId ? (
                        <motion.div
                            key="all-counselors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Counselor Directory</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a team member to manage their leave cycle</p>
                            </div>

                            <div className="space-y-3">
                                {counselorsLoading ? (
                                    [1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
                                    ))
                                ) : counselors.length === 0 ? (
                                    <div className="bg-white rounded-[2.5rem] p-32 text-center border-2 border-dashed border-slate-100">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                                        <p className="text-xl font-bold text-slate-400 italic">No counselors found.</p>
                                    </div>
                                ) : (
                                    counselors.map((c, idx) => (
                                        <motion.button
                                            key={c.counselorId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedCounselorId(c.counselorId)}
                                            className="w-full text-left bg-white p-5 rounded-[1.5rem] border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 font-black flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                                                {c.name.charAt(0)}
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                                <div>
                                                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight truncate">{c.name}</h4>

                                                </div>

                                                <div className="hidden sm:flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{c.email}</div>
                                                </div>

                                                <div className="hidden sm:flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
                                                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{c.departments?.join(', ') || 'Counselor'}</div>
                                                </div>
                                            </div>

                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Simple Profile Header */}
                            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <button
                                        onClick={() => setSelectedCounselorId(null)}
                                        className="p-2.5 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-slate-500"
                                        title="Back to List"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Audit Mode: Active</p>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={selectedCounselorId || ''}
                                                onChange={(e) => setSelectedCounselorId(Number(e.target.value))}
                                                className="bg-transparent text-xl font-bold text-slate-900 outline-none cursor-pointer focus:text-indigo-600 transition-colors uppercase"
                                            >
                                                {counselors.map(c => (
                                                    <option key={c.counselorId} value={c.counselorId}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedCounselor?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span>{selectedCounselor?.departments?.join(', ') || 'Department'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Audit Feed */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Leave Requests</h3>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        {leaves.length} TOTAL
                                    </div>
                                </div>

                                {leavesLoading ? (
                                    <div className="py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updating feed…</p>
                                    </div>
                                ) : leaves.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-slate-400 font-bold italic text-sm">No leave records found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {leaves.map((leave, idx) => (
                                            <motion.div
                                                key={leave.id || idx}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="group bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {leave.status === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> :
                                                            leave.status === 'REJECTED' ? <XCircle className="w-5 h-5" /> :
                                                                <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 uppercase tracking-tight">{leave.reason}</h4>
                                                        <div className="flex items-center gap-4 mt-1.5">
                                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                {leave.startDate} — {leave.endDate}
                                                            </div>
                                                            {leave.status !== 'REJECTED' && (
                                                                <button
                                                                    onClick={() => startEditing(leave)}
                                                                    className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                                                                >
                                                                    Modify Dates
                                                                </button>
                                                            )}
                                                        </div>

                                                        {editingDatesId === leave.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 overflow-hidden"
                                                            >
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={editStartDate}
                                                                        onChange={(e) => setEditStartDate(e.target.value)}
                                                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={editEndDate}
                                                                        onChange={(e) => setEditEndDate(e.target.value)}
                                                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 ml-auto pt-4 md:pt-0">
                                                                    <button
                                                                        onClick={() => handleUpdateDates(leave.id!)}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
                                                                    >
                                                                        <Save className="w-3.5 h-3.5" />
                                                                        Save Dates
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingDatesId(null)}
                                                                        className="p-2 bg-white text-slate-400 border border-slate-200 rounded-lg hover:text-rose-600 transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end md:self-center">
                                                    {leave.status === 'PENDING' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(leave.id!, 'APPROVED')}
                                                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(leave.id!, 'REJECTED')}
                                                                className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors border border-slate-200"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                            {leave.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}
