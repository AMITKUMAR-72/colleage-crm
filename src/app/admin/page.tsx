'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorManager from '@/components/admin/CounselorManager';
import AuditMonitor from '@/components/admin/AuditMonitor';
import { LeadService } from '@/services/leadService';

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams ? searchParams.get('tab') as 'OVERVIEW' | 'COUNSELORS' | 'MONITOR' | null : null;
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COUNSELORS' | 'MONITOR'>(tabParam || 'OVERVIEW');
    const [leadsCount, setLeadsCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log("[AdminDashboard] Fetching stats via RecentLeads...");
                const leadsData = await LeadService.getRecentLeads(0, 1);


                let count = 0;
                if (leadsData && typeof leadsData === 'object') {
                    const l = leadsData as any;
                    // Check for count in all known nested formats
                    const explicitCount = l.count ?? l.data?.count ?? l.totalElements ?? l.data?.totalElements;

                    if (typeof explicitCount === 'number') {
                        count = explicitCount;
                    } else {
                        const array = l.lead || l.data?.lead || l.content || l.data?.content || [];
                        count = Array.isArray(array) ? array.length : 0;
                    }
                }

                console.log("[AdminDashboard] Calculated final count:", count);
                setLeadsCount(count);
            } catch (error) {
                console.error("[AdminDashboard] Failed to fetch stats:", error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    return (
        <>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#4d0101]/10 text-[#600202] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4d0101]/20">
                            Admin Portal
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[#dbb212]">
                            Premium Control
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        System Management
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Maintain the integrity of the Raffles Management Ecosystem.</p>
                </div>
            </header>

            {/* Responsive Tabs Navigation */}
            <div className="relative mb-8">
                <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === 'OVERVIEW'
                            ? 'bg-white text-[#600202] shadow-lg shadow-rose-900/5 translate-y-[-1px]'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('COUNSELORS')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === 'COUNSELORS'
                            ? 'bg-white text-[#600202] shadow-lg shadow-rose-900/5 translate-y-[-1px]'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Counselors
                    </button>
                    <button
                        onClick={() => setActiveTab('MONITOR')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === 'MONITOR'
                            ? 'bg-white text-[#600202] shadow-lg shadow-rose-900/5 translate-y-[-1px]'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Monitor
                    </button>
                </div>
            </div>

            {activeTab === 'OVERVIEW' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">Total Leads</h3>
                            <p className="text-2xl font-black text-[#4d0101]">{leadsCount}</p>

                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">CONVERTED LEADS</h3>
                            <p className="text-sm text-yellow-600 font-bold uppercase tracking-widest mt-2">On Working</p>
                        </div>

                    </div>

                    <LeadInbox />
                </>
            ) : activeTab === 'COUNSELORS' ? (
                <CounselorManager />
            ) : (
                <AuditMonitor />
            )}
        </>
    );
}

export default function AdminDashboard() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Portal...</div>}>
                <AdminDashboardContent />
            </Suspense>
        </DashboardLayout>
    );
}
