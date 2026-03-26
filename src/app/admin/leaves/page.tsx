'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CounselorLeaveManager from '@/components/admin/CounselorLeaveManager';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function CounselorLeavesPage() {
    return (
        <DashboardLayout>
            <Toaster position="top-right" />
            <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                                Management Portal
                            </span>
                            <div className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Leave Audit Control
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Counselor <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Leaves</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Manage counselor availability and approve/reject leave requests to maintain system integrity.</p>
                    </div>
                </header>

                <div className="bg-indigo-50/50 p-10 rounded-[4rem] border border-indigo-100 shadow-inner">
                    <CounselorLeaveManager />
                </div>

                {/* System info */}
                <div className="flex items-center justify-center py-6 gap-3">
                    <Calendar className="w-4 h-4 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Leave processing updates counselor availability in real-time</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
