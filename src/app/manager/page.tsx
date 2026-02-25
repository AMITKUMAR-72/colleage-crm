'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import AssignedLeadsMonitor from '@/components/manager/AssignedLeadsMonitor';
import ContactedLeadsMonitor from '@/components/manager/ContactedLeadsMonitor';
import { LayoutDashboard, UserCheck, PhoneCall, History } from 'lucide-react';

export default function ManagerDashboard() {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSIGNMENTS' | 'ENGAGEMENT'>('OVERVIEW');

    return (
        <DashboardLayout>
<<<<<<< HEAD
            {/* Header & Tabs */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manager Control Center</h1>
                        <p className="text-slate-500 font-medium text-sm">Strategic oversight and team performance monitoring.</p>
=======
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#4d0101]/10 text-[#600202] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4d0101]/20">
                            Manager Portal
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[#dbb212]">
                            Strategy Center
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Team Performance
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Optimizing counselor workflows and lead distribution.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group text-center h-full flex flex-col justify-center">
                        <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-green-600">Lead Reassignment</h3>
                        <p className="text-sm text-gray-500">Quick actions for timed-out leads.</p>
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
                    </div>
                </div>

                <div className="flex gap-1 bg-slate-100/50 p-1 rounded-2xl w-fit border border-slate-200/60">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'OVERVIEW'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        OVERVIEW
                    </button>
                    <button
                        onClick={() => setActiveTab('ASSIGNMENTS')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ASSIGNMENTS'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        ASSIGNMENTS
                    </button>
                    <button
                        onClick={() => setActiveTab('ENGAGEMENT')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ENGAGEMENT'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        <PhoneCall className="w-4 h-4" />
                        ENGAGEMENT
                    </button>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'OVERVIEW' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                            <div className="lg:col-span-3">
                                <div onClick={() => setActiveTab('ASSIGNMENTS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group flex flex-col items-center justify-center text-center h-full gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm group-hover:text-green-600 uppercase tracking-tight">Assignment Logs</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Review Distribution</p>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3">
                                <div onClick={() => setActiveTab('ENGAGEMENT')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group flex flex-col items-center justify-center text-center h-full gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <PhoneCall className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 uppercase tracking-tight">Team Engagement</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Contact Metrics</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <LeadInbox />
                        </div>
                    </>
                )}

                {activeTab === 'ASSIGNMENTS' && <AssignedLeadsMonitor />}
                {activeTab === 'ENGAGEMENT' && <ContactedLeadsMonitor />}
            </div>
        </DashboardLayout>
    );
}
