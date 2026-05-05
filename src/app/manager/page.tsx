'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ManagerLeadInbox from '@/components/manager/ManagerLeadInbox';
import AssignedLeadsMonitor from '@/components/manager/AssignedLeadsMonitor';

function ManagerDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams ? searchParams.get('tab') as 'OVERVIEW' | 'ASSIGNMENTS' | null : null;
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSIGNMENTS'>(tabParam || 'OVERVIEW');

    // Sync tab from URL param on load/navigation
    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [tabParam, activeTab]);

    // Sync active tab to URL so reload preserves the correct tab
    const handleTabChange = (tab: 'OVERVIEW' | 'ASSIGNMENTS') => {
        setActiveTab(tab);
        router.replace(`?tab=${tab}`, { scroll: false });
    };

    return (
        <DashboardLayout>
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                {/* Statistics / Links */}
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div
                        onClick={() => handleTabChange('ASSIGNMENTS')}
                        className="w-full md:w-72 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
                    >
                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-green-600 transition-colors uppercase">ASSIGNMENT LOGS</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Review Distribution</p>
                        </div>
                    </div>
                </div>

                {/* Responsive Tabs Navigation */}
                <div className="relative">
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => handleTabChange('OVERVIEW')}
                            className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === 'OVERVIEW'
                                ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-900/5 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            OVERVIEW
                        </button>
                        <button
                            onClick={() => handleTabChange('ASSIGNMENTS')}
                            className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === 'ASSIGNMENTS'
                                ? 'bg-white text-green-600 shadow-lg shadow-green-900/5 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            ASSIGNMENTS
                        </button>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'OVERVIEW' && (
                    <>
                        <div className="w-full">
                            <ManagerLeadInbox />
                        </div>
                    </>
                )}

                {activeTab === 'ASSIGNMENTS' && <AssignedLeadsMonitor />}
            </div>

        </DashboardLayout>
    );
}

export default function ManagerDashboard() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Portal...</div>}>
            <ManagerDashboardContent />
        </Suspense>
    );
}
