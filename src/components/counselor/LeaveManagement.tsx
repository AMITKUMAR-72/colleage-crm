'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeaveService } from '@/services/leaveService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileText, Send, CheckCircle2, History, Clock, CheckCircle, XCircle } from 'lucide-react';

interface LeaveRequest {
    startDate: string;
    endDate: string;
    reason: string;
}

export default function LeaveManagement() {
    const [formData, setFormData] = useState<LeaveRequest>({
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const data = await LeaveService.getMyLeaves();
            setLeaveHistory(Array.isArray(data) ? data : (data as any)?.data || []);
        } catch (error) {
            console.error('Failed to fetch leave history:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            toast.error('Please fill in all fields');
            return;
        }

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }

        setLoading(true);
        try {
            const data = await LeaveService.applyLeave(formData);
            setSuccessData(data);
            toast.success('Leave application submitted successfully');
            setFormData({ startDate: '', endDate: '', reason: '' });
            fetchHistory(); // Refresh history
        } catch (error) {
            console.error('Failed to apply for leave:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <header className="mb-10 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block"
                >
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                        Counselor Well-being
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight items-center justify-center gap-2">
                        My <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Leave Application</span>
                    </h2>
                    <p className="text-slate-500 font-medium mt-2 max-w-md mx-auto">
                        Submit your leave requests here. Applications are reviewed by the management team.
                    </p>
                </motion.div>
            </header>

            <AnimatePresence mode="wait">
                {successData ? (
                    <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100 border border-slate-100 text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Application Received</h3>
                        <p className="text-slate-400 font-medium mb-8">Your request for {successData.reason} is currently <span className="text-amber-500 font-black tracking-widest uppercase text-xs px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md">PENDING</span></p>
                        
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 max-w-sm mx-auto">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                <span className="text-xs font-bold text-slate-700">{successData.startDate} — {successData.endDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                                <span className="text-xs font-bold text-slate-700">{successData.reason}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSuccessData(null)}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            Apply for Another
                        </button>
                    </motion.div>
                ) : (
                    <motion.form 
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleSubmit}
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100 border border-slate-100 space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-indigo-500" />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-indigo-500" />
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FileText className="w-3 h-3 text-indigo-500" />
                                Reason for Leave
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Explain your reason (Sick leave, Personal, etc.)"
                                rows={4}
                                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Submit Application</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Leave History Section */}
            <div className="mt-16 space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Requests</h3>
                    <div className="h-px flex-1 bg-slate-100 ml-2" />
                </div>

                {historyLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-50" />
                        ))}
                    </div>
                ) : leaveHistory.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
                        <p className="text-slate-300 font-bold italic">No previous leave applications found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaveHistory.map((leave, idx) => (
                            <motion.div
                                key={leave.id || idx}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-100 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                        'bg-amber-50 text-amber-600'
                                    }`}>
                                        {leave.status === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> :
                                         leave.status === 'REJECTED' ? <XCircle className="w-5 h-5" /> :
                                         <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{leave.reason}</div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {leave.startDate} <span className="text-slate-200">/</span> {leave.endDate}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border whitespace-nowrap ${
                                    leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    {leave.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
